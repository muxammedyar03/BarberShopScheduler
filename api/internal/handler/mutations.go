package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

func decodeJSON(w http.ResponseWriter, r *http.Request, dest any) bool {
	if err := json.NewDecoder(r.Body).Decode(dest); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return false
	}
	return true
}

func (a *API) invalidateCollate(w http.ResponseWriter, r *http.Request, resource string) {
	if a.cache == nil {
		return
	}
	_ = a.cache.InvalidatePrefix(r.Context(), "collate:"+resource)
}

type barberBody struct {
	ID            string          `json:"id"`
	Name          string          `json:"name"`
	Phone         string          `json:"phone"`
	Avatar        string          `json:"avatar"`
	IsActive      bool            `json:"is_active"`
	IsBlocked     bool            `json:"is_blocked"`
	WorkingHours  json.RawMessage `json:"working_hours"`
	WorkingDays   []int32         `json:"working_days"`
	Status        string          `json:"status"`
	MonthlyFee    int64           `json:"monthly_fee"`
	BillingDay    int32           `json:"billing_day"`
	PaymentStatus string          `json:"payment_status"`
}

func (a *API) putBarber(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body barberBody
	if !decodeJSON(w, r, &body) {
		return
	}
	ctx := r.Context()
	_, err := a.pool.Exec(ctx, `
		UPDATE barbers SET
			name = $2, phone = $3, avatar = $4, is_active = $5, is_blocked = $6,
			working_hours = $7, working_days = $8, status = $9,
			monthly_fee = $10, billing_day = $11, payment_status = $12, updated_at = now()
		WHERE id = $1`,
		id, body.Name, body.Phone, body.Avatar, body.IsActive, body.IsBlocked,
		body.WorkingHours, body.WorkingDays, body.Status, body.MonthlyFee, body.BillingDay, body.PaymentStatus,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	a.invalidateCollate(w, r, "barbers")
	writeJSON(w, http.StatusOK, map[string]string{"id": id})
}

func (a *API) postBarber(w http.ResponseWriter, r *http.Request) {
	var body barberBody
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.ID == "" {
		body.ID = "b-" + strings.ReplaceAll(time.Now().Format("150405.000"), ".", "")
	}
	ctx := r.Context()
	_, err := a.pool.Exec(ctx, `
		INSERT INTO barbers (id, name, phone, avatar, is_active, is_blocked, working_hours, working_days, status, monthly_fee, billing_day, payment_status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name, phone = EXCLUDED.phone, avatar = EXCLUDED.avatar,
			is_active = EXCLUDED.is_active, is_blocked = EXCLUDED.is_blocked,
			working_hours = EXCLUDED.working_hours, working_days = EXCLUDED.working_days,
			status = EXCLUDED.status, monthly_fee = EXCLUDED.monthly_fee,
			billing_day = EXCLUDED.billing_day, payment_status = EXCLUDED.payment_status,
			updated_at = now()`,
		body.ID, body.Name, body.Phone, body.Avatar, body.IsActive, body.IsBlocked,
		body.WorkingHours, body.WorkingDays, body.Status, body.MonthlyFee, body.BillingDay, body.PaymentStatus,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	a.invalidateCollate(w, r, "barbers")
	writeJSON(w, http.StatusOK, map[string]string{"id": body.ID})
}

func (a *API) deleteBarber(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id required")
		return
	}
	ctx := r.Context()
	tag, err := a.pool.Exec(ctx, `DELETE FROM barbers WHERE id = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "barber not found")
		return
	}
	a.invalidateCollate(w, r, "barbers")
	a.invalidateCollate(w, r, "appointments")
	a.invalidateCollate(w, r, "invoices")
	a.invalidateCollate(w, r, "cash_logs")
	writeJSON(w, http.StatusOK, map[string]string{"id": id})
}

type appointmentBody struct {
	ID            string  `json:"id"`
	BarberID      string  `json:"barber_id"`
	ClientName    string  `json:"client_name"`
	ClientPhone   string  `json:"client_phone"`
	StartTime     string  `json:"start_time"`
	EndTime       string  `json:"end_time"`
	Date          string  `json:"date"`
	Category      string  `json:"category"`
	Status        string  `json:"status"`
	PaymentMethod *string `json:"payment_method"`
	Price         int64   `json:"price"`
}

func (a *API) postAppointment(w http.ResponseWriter, r *http.Request) {
	var body appointmentBody
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.ID == "" {
		body.ID = "a-" + strings.ReplaceAll(time.Now().Format("150405.000"), ".", "")
	}
	ctx := r.Context()
	_, err := a.pool.Exec(ctx, `
		INSERT INTO appointments (id, barber_id, client_name, client_phone, start_time, end_time, date, category, status, payment_method, price)
		VALUES ($1,$2,$3,$4,$5,$6,$7::date,$8,$9,$10,$11)`,
		body.ID, body.BarberID, body.ClientName, body.ClientPhone, body.StartTime, body.EndTime,
		body.Date, body.Category, body.Status, body.PaymentMethod, body.Price,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	a.invalidateCollate(w, r, "appointments")
	writeJSON(w, http.StatusOK, map[string]string{"id": body.ID})
}

func (a *API) putAppointment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body appointmentBody
	if !decodeJSON(w, r, &body) {
		return
	}
	ctx := r.Context()
	_, err := a.pool.Exec(ctx, `
		UPDATE appointments SET
			barber_id = $2, client_name = $3, client_phone = $4, start_time = $5, end_time = $6,
			date = $7::date, category = $8, status = $9, payment_method = $10, price = $11, updated_at = now()
		WHERE id = $1`,
		id, body.BarberID, body.ClientName, body.ClientPhone, body.StartTime, body.EndTime,
		body.Date, body.Category, body.Status, body.PaymentMethod, body.Price,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	a.invalidateCollate(w, r, "appointments")
	writeJSON(w, http.StatusOK, map[string]string{"id": id})
}

type invoiceBody struct {
	ID         string `json:"id"`
	BarberID   string `json:"barber_id"`
	BarberName string `json:"barber_name"`
	Amount     int64  `json:"amount"`
	IssueDate  string `json:"issue_date"`
	DueDate    string `json:"due_date"`
	Status     string `json:"status"`
}

func (a *API) postInvoice(w http.ResponseWriter, r *http.Request) {
	var body invoiceBody
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.ID == "" {
		body.ID = "inv-" + strings.ReplaceAll(time.Now().Format("150405.000"), ".", "")
	}
	ctx := r.Context()
	_, err := a.pool.Exec(ctx, `
		INSERT INTO invoices (id, barber_id, barber_name, amount, issue_date, due_date, status)
		VALUES ($1,$2,$3,$4,$5::date,$6::date,$7)
		ON CONFLICT (id) DO UPDATE SET
			barber_id = EXCLUDED.barber_id, barber_name = EXCLUDED.barber_name,
			amount = EXCLUDED.amount, issue_date = EXCLUDED.issue_date,
			due_date = EXCLUDED.due_date, status = EXCLUDED.status, updated_at = now()`,
		body.ID, body.BarberID, body.BarberName, body.Amount, body.IssueDate, body.DueDate, body.Status,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	a.invalidateCollate(w, r, "invoices")
	writeJSON(w, http.StatusOK, map[string]string{"id": body.ID})
}

func (a *API) putInvoice(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body invoiceBody
	if !decodeJSON(w, r, &body) {
		return
	}
	ctx := r.Context()
	_, err := a.pool.Exec(ctx, `
		UPDATE invoices SET
			barber_id = $2, barber_name = $3, amount = $4,
			issue_date = $5::date, due_date = $6::date, status = $7, updated_at = now()
		WHERE id = $1`,
		id, body.BarberID, body.BarberName, body.Amount, body.IssueDate, body.DueDate, body.Status,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	a.invalidateCollate(w, r, "invoices")
	writeJSON(w, http.StatusOK, map[string]string{"id": id})
}

type cashLogBody struct {
	ID          string `json:"id"`
	BarberID    string `json:"barber_id"`
	Type        string `json:"type"`
	Amount      int64  `json:"amount"`
	Category    string `json:"category"`
	Date        string `json:"date"`
	Description string `json:"description"`
}

func (a *API) postCashLog(w http.ResponseWriter, r *http.Request) {
	var body cashLogBody
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.ID == "" {
		body.ID = "l-" + strings.ReplaceAll(time.Now().Format("150405.000"), ".", "")
	}
	ctx := r.Context()
	_, err := a.pool.Exec(ctx, `
		INSERT INTO cash_logs (id, barber_id, type, amount, category, date, description)
		VALUES ($1,$2,$3,$4,$5,$6::date,$7)`,
		body.ID, body.BarberID, body.Type, body.Amount, body.Category, body.Date, body.Description,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	a.invalidateCollate(w, r, "cash_logs")
	writeJSON(w, http.StatusOK, map[string]string{"id": body.ID})
}
