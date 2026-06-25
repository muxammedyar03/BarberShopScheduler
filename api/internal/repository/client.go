package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/barber-queue/api/internal/collate"
	"github.com/barber-queue/api/internal/query"
)

type ClientRepo struct {
	pool *pgxpool.Pool
}

func NewClient(pool *pgxpool.Pool) *ClientRepo {
	return &ClientRepo{pool: pool}
}

const discoverFromClause = `barbers b
LEFT JOIN LATERAL (
	SELECT
		(SELECT COUNT(*)::int FROM appointments a
		 WHERE a.barber_id = b.id AND a.date = CURRENT_DATE AND a.status <> 'skipped') AS booked_today,
		CASE
			WHEN EXTRACT(ISODOW FROM CURRENT_DATE)::int = ANY(b.working_days) THEN
				GREATEST(0, (
					(CAST(split_part(b.working_hours->>'end', ':', 1) AS int) * 60
					 + CAST(split_part(b.working_hours->>'end', ':', 2) AS int))
					- (CAST(split_part(b.working_hours->>'start', ':', 1) AS int) * 60
					 + CAST(split_part(b.working_hours->>'start', ':', 2) AS int))
				) / 30)
			ELSE 0
		END AS capacity_today
) slot ON true
LEFT JOIN client_favorites f ON f.barber_id = b.id AND f.user_id = $1`

const discoverBaseSelect = `
SELECT
	b.id, b.name, b.phone, b.avatar, b.is_active, b.is_blocked,
	b.working_hours, b.working_days, b.status, b.monthly_fee, b.billing_day,
	b.payment_status, b.city, b.district, b.address, b.rating,
	b.created_at, b.updated_at,
	COALESCE(slot.booked_today, 0)::int AS booked_today,
	COALESCE(slot.capacity_today, 0)::int AS capacity_today,
	(
		b.is_active AND NOT b.is_blocked
		AND EXTRACT(ISODOW FROM CURRENT_DATE)::int = ANY(b.working_days)
		AND COALESCE(slot.booked_today, 0) < COALESCE(slot.capacity_today, 0)
	) AS has_free_today,
	(f.id IS NOT NULL) AS is_favorite
FROM ` + discoverFromClause

var discoverResource = collate.Resource{
	Table:       "barbers",
	FromClause:  discoverFromClause,
	Select:      discoverBaseSelect,
	SearchExpr:  "(b.name ILIKE $%d OR b.phone ILIKE $%d OR b.city ILIKE $%d)",
	DefaultSort: "b.name ASC",
	Columns: map[string]collate.ColumnDef{
		"name":       {DBColumn: "b.name", Kind: collate.KindSort},
		"search":     {DBColumn: "b.name", Kind: collate.KindSearch},
		"status":     {DBColumn: "b.status", Kind: collate.KindCheckboxes},
		"city":       {DBColumn: "b.city", Kind: collate.KindCheckboxes},
		"is_active":  {DBColumn: "b.is_active", Kind: collate.KindCheckbuttons},
		"is_blocked": {DBColumn: "b.is_blocked", Kind: collate.KindCheckbuttons},
		"rating":     {DBColumn: "b.rating", Kind: collate.KindSort},
	},
}

type DiscoverParams struct {
	UserID        string
	ClientCity    string
	OnlyAvailable bool
	Query         query.DQuery
}

func (r *ClientRepo) DiscoverBarbers(ctx context.Context, p DiscoverParams) (query.DCollate[json.RawMessage], error) {
	extra := []string{
		"b.is_active = true",
		"b.is_blocked = false",
	}
	extraArgs := []any{p.UserID}

	if strings.TrimSpace(p.ClientCity) != "" {
		extra = append(extra, fmt.Sprintf("b.city = $%d", len(extraArgs)+1))
		extraArgs = append(extraArgs, p.ClientCity)
	}
	if p.OnlyAvailable {
		extra = append(extra, `(
			EXTRACT(ISODOW FROM CURRENT_DATE)::int = ANY(b.working_days)
			AND COALESCE(slot.booked_today, 0) < COALESCE(slot.capacity_today, 0)
		)`)
	}

	extraSQL := strings.Join(extra, " AND ")
	countSQL, dataSQL, countArgs, dataArgs, err := collate.Build(discoverResource, p.Query, extraSQL, extraArgs)
	if err != nil {
		return query.DCollate[json.RawMessage]{}, err
	}

	var total int64
	if err := r.pool.QueryRow(ctx, countSQL, countArgs...).Scan(&total); err != nil {
		return query.DCollate[json.RawMessage]{}, fmt.Errorf("count: %w", err)
	}

	rows, err := r.pool.Query(ctx, dataSQL, dataArgs...)
	if err != nil {
		return query.DCollate[json.RawMessage]{}, fmt.Errorf("select: %w", err)
	}
	defer rows.Close()

	data, err := scanRowsJSON(rows)
	if err != nil {
		return query.DCollate[json.RawMessage]{}, err
	}

	return query.DCollate[json.RawMessage]{
		Total:    total,
		Filtered: total,
		Data:     data,
		Query:    p.Query,
		Summary:  map[string]int{},
	}, nil
}

func (r *ClientRepo) MyQueue(ctx context.Context, userID string) ([]json.RawMessage, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT a.*, b.name AS barber_name, b.avatar AS barber_avatar, b.city AS barber_city
		FROM appointments a
		JOIN barbers b ON b.id = a.barber_id
		WHERE a.client_user_id = $1
		  AND a.date = CURRENT_DATE
		  AND a.status IN ('pending', 'active')
		ORDER BY a.start_time ASC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRowsJSON(rows)
}

func (r *ClientRepo) MyHistory(ctx context.Context, userID string, q query.DQuery) (query.DCollate[json.RawMessage], error) {
	extraSQL := "a.client_user_id = $1"
	extraArgs := []any{userID}

	res := collate.Resource{
		Table: "appointments",
		FromClause: `appointments a JOIN barbers b ON b.id = a.barber_id`,
		Select: `SELECT a.*, b.name AS barber_name, b.avatar AS barber_avatar, b.city AS barber_city
			FROM appointments a JOIN barbers b ON b.id = a.barber_id`,
		SearchExpr:  "(a.client_name ILIKE $%d OR b.name ILIKE $%d)",
		DefaultSort: "a.date DESC, a.start_time DESC",
		Columns: map[string]collate.ColumnDef{
			"search":     {DBColumn: "a.client_name", Kind: collate.KindSearch},
			"status":     {DBColumn: "a.status", Kind: collate.KindCheckboxes},
			"date":       {DBColumn: "a.date", Kind: collate.KindDateRange},
			"start_time": {DBColumn: "a.start_time", Kind: collate.KindSort},
		},
	}

	countSQL, dataSQL, countArgs, dataArgs, err := collate.Build(res, q, extraSQL, extraArgs)
	if err != nil {
		return query.DCollate[json.RawMessage]{}, err
	}

	var total int64
	if err := r.pool.QueryRow(ctx, countSQL, countArgs...).Scan(&total); err != nil {
		return query.DCollate[json.RawMessage]{}, err
	}

	rows, err := r.pool.Query(ctx, dataSQL, dataArgs...)
	if err != nil {
		return query.DCollate[json.RawMessage]{}, err
	}
	defer rows.Close()

	data, err := scanRowsJSON(rows)
	if err != nil {
		return query.DCollate[json.RawMessage]{}, err
	}

	return query.DCollate[json.RawMessage]{
		Total: total, Filtered: total, Data: data, Query: q, Summary: map[string]int{},
	}, nil
}

func (r *ClientRepo) RecentBarbers(ctx context.Context, userID string, limit int) ([]json.RawMessage, error) {
	if limit <= 0 || limit > 20 {
		limit = 8
	}
	rows, err := r.pool.Query(ctx, `
		SELECT b.id, b.name, b.phone, b.avatar, b.status, b.city, b.rating,
			MAX(a.date) AS last_visit
		FROM appointments a
		JOIN barbers b ON b.id = a.barber_id
		WHERE a.client_user_id = $1
		GROUP BY b.id, b.name, b.phone, b.avatar, b.status, b.city, b.rating
		ORDER BY MAX(a.date) DESC
		LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRowsJSON(rows)
}

func (r *ClientRepo) ListFavorites(ctx context.Context, userID string, q query.DQuery) (query.DCollate[json.RawMessage], error) {
	extraSQL := "f.user_id = $1"
	extraArgs := []any{userID}

	res := collate.Resource{
		Table: "client_favorites",
		FromClause: `client_favorites f JOIN barbers b ON b.id = f.barber_id`,
		Select: `SELECT b.id, b.name, b.phone, b.avatar, b.status, b.city, b.rating,
			b.working_hours, b.working_days, f.created_at AS favorited_at
			FROM client_favorites f JOIN barbers b ON b.id = f.barber_id`,
		SearchExpr:  "(b.name ILIKE $%d OR b.city ILIKE $%d)",
		DefaultSort: "f.created_at DESC",
		Columns: map[string]collate.ColumnDef{
			"search": {DBColumn: "b.name", Kind: collate.KindSearch},
			"name":   {DBColumn: "b.name", Kind: collate.KindSort},
		},
	}

	countSQL, dataSQL, countArgs, dataArgs, err := collate.Build(res, q, extraSQL, extraArgs)
	if err != nil {
		return query.DCollate[json.RawMessage]{}, err
	}

	var total int64
	if err := r.pool.QueryRow(ctx, countSQL, countArgs...).Scan(&total); err != nil {
		return query.DCollate[json.RawMessage]{}, err
	}

	rows, err := r.pool.Query(ctx, dataSQL, dataArgs...)
	if err != nil {
		return query.DCollate[json.RawMessage]{}, err
	}
	defer rows.Close()

	data, err := scanRowsJSON(rows)
	if err != nil {
		return query.DCollate[json.RawMessage]{}, err
	}

	return query.DCollate[json.RawMessage]{
		Total: total, Filtered: total, Data: data, Query: q, Summary: map[string]int{},
	}, nil
}

func (r *ClientRepo) AddFavorite(ctx context.Context, userID, barberID string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO client_favorites (user_id, barber_id) VALUES ($1, $2)
		ON CONFLICT (user_id, barber_id) DO NOTHING`,
		userID, barberID,
	)
	return err
}

func (r *ClientRepo) RemoveFavorite(ctx context.Context, userID, barberID string) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM client_favorites WHERE user_id = $1 AND barber_id = $2`,
		userID, barberID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *ClientRepo) ListSearchHistory(ctx context.Context, userID string, limit int) ([]json.RawMessage, error) {
	if limit <= 0 || limit > 50 {
		limit = 10
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, term, created_at FROM client_search_history
		WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRowsJSON(rows)
}

func (r *ClientRepo) AddSearchTerm(ctx context.Context, userID, term string) error {
	term = strings.TrimSpace(term)
	if term == "" {
		return nil
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO client_search_history (user_id, term) VALUES ($1, $2)`,
		userID, term,
	)
	return err
}

type ClientProfile struct {
	ID            string  `json:"id"`
	Email         string  `json:"email"`
	DisplayName   string  `json:"displayName"`
	PhotoURL      *string `json:"photoURL"`
	FirstName     *string `json:"firstName"`
	LastName      *string `json:"lastName"`
	Phone         *string `json:"phone"`
	City          *string `json:"city"`
	Address       *string `json:"address"`
	AuthProvider  string  `json:"authProvider"`
	EmailVerified bool    `json:"emailVerified"`
}

func (r *ClientRepo) GetProfile(ctx context.Context, userID string) (ClientProfile, error) {
	var p ClientProfile
	err := r.pool.QueryRow(ctx, `
		SELECT id::text, email, COALESCE(display_name,''), photo_url,
			first_name, last_name, phone, city, address,
			auth_provider, email_verified
		FROM users WHERE id = $1 AND role = 'client'`,
		userID,
	).Scan(&p.ID, &p.Email, &p.DisplayName, &p.PhotoURL,
		&p.FirstName, &p.LastName, &p.Phone, &p.City, &p.Address,
		&p.AuthProvider, &p.EmailVerified,
	)
	return p, err
}

type ProfileUpdate struct {
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	Phone       string `json:"phone"`
	City        string `json:"city"`
	Address     string `json:"address"`
	DisplayName string `json:"displayName"`
}

func (r *ClientRepo) UpdateProfile(ctx context.Context, userID string, u ProfileUpdate) error {
	display := strings.TrimSpace(u.DisplayName)
	if display == "" {
		display = strings.TrimSpace(u.FirstName + " " + u.LastName)
	}
	_, err := r.pool.Exec(ctx, `
		UPDATE users SET
			first_name = $2, last_name = $3, phone = $4, city = $5, address = $6,
			display_name = $7, updated_at = now()
		WHERE id = $1 AND role = 'client'`,
		userID, u.FirstName, u.LastName, u.Phone, u.City, u.Address, display,
	)
	return err
}

type BookAppointmentInput struct {
	ID          string `json:"id"`
	BarberID    string `json:"barber_id"`
	ClientName  string `json:"client_name"`
	ClientPhone string `json:"client_phone"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	Date        string `json:"date"`
	Category    string `json:"category"`
	Status      string `json:"status"`
	Price       int64  `json:"price"`
}

func (r *ClientRepo) BarberSlots(ctx context.Context, barberID, date string) ([]map[string]any, error) {
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	var wh json.RawMessage
	var workingDays []int32
	var status string
	err := r.pool.QueryRow(ctx, `
		SELECT working_hours, working_days, status FROM barbers WHERE id = $1 AND is_active AND NOT is_blocked`,
		barberID,
	).Scan(&wh, &workingDays, &status)
	if err != nil {
		return nil, err
	}

	var hours struct{ Start, End string }
	_ = json.Unmarshal(wh, &hours)
	if hours.Start == "" {
		hours.Start = "09:00"
	}
	if hours.End == "" {
		hours.End = "18:00"
	}

	rows, err := r.pool.Query(ctx, `
		SELECT start_time, end_time FROM appointments
		WHERE barber_id = $1 AND date = $2::date AND status <> 'skipped'`,
		barberID, date,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type appt struct{ start, end string }
	var booked []appt
	for rows.Next() {
		var a appt
		if err := rows.Scan(&a.start, &a.end); err != nil {
			return nil, err
		}
		booked = append(booked, a)
	}

	parseHM := func(s string) (int, int) {
		var h, m int
		fmt.Sscanf(s, "%d:%d", &h, &m)
		return h, m
	}

	startH, startM := parseHM(hours.Start)
	endH, endM := parseHM(hours.End)
	curH, curM := startH, startM
	slots := make([]map[string]any, 0)

	for curH < endH || (curH == endH && curM < endM) {
		timeStr := fmt.Sprintf("%02d:%02d", curH, curM)
		isBooked := false
		for _, a := range booked {
			if a.start <= timeStr && a.end > timeStr {
				isBooked = true
				break
			}
		}
		slots = append(slots, map[string]any{"time": timeStr, "isBooked": isBooked})

		curM += 30
		if curM >= 60 {
			curH++
			curM -= 60
		}
	}

	return slots, nil
}

func (r *ClientRepo) BookAppointment(ctx context.Context, userID string, in BookAppointmentInput) (string, error) {
	if in.ID == "" {
		in.ID = "a-" + strings.ReplaceAll(time.Now().Format("150405.000"), ".", "")
	}
	if in.Date == "" {
		in.Date = time.Now().Format("2006-01-02")
	}
	if in.Status == "" {
		in.Status = "pending"
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO appointments (
			id, barber_id, client_user_id, client_name, client_phone,
			start_time, end_time, date, category, status, price
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date,$9,$10,$11)`,
		in.ID, in.BarberID, userID, in.ClientName, in.ClientPhone,
		in.StartTime, in.EndTime, in.Date, in.Category, in.Status, in.Price,
	)
	return in.ID, err
}

func scanRowsJSON(rows pgx.Rows) ([]json.RawMessage, error) {
	descs := rows.FieldDescriptions()
	data := make([]json.RawMessage, 0)
	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			return nil, err
		}
		obj := make(map[string]any)
		for i, fd := range descs {
			obj[string(fd.Name)] = normalize(vals[i])
		}
		raw, err := json.Marshal(obj)
		if err != nil {
			return nil, err
		}
		data = append(data, raw)
	}
	return data, rows.Err()
}

func normalize(v any) any {
	switch x := v.(type) {
	case []byte:
		return string(x)
	default:
		return x
	}
}
