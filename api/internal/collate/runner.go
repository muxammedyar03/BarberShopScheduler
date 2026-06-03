package collate

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/barber-queue/api/internal/query"
)

type Runner struct {
	pool *pgxpool.Pool
}

func NewRunner(pool *pgxpool.Pool) *Runner {
	return &Runner{pool: pool}
}

func (r *Runner) Run(ctx context.Context, resource string, req query.CollateRequest) (query.DCollate[json.RawMessage], error) {
	res, ok := Registry[resource]
	if !ok {
		return query.DCollate[json.RawMessage]{}, fmt.Errorf("unknown resource: %s", resource)
	}

	extraSQL, extraArgs := ExtraWhere(req.Where)
	countSQL, dataSQL, countArgs, dataArgs, err := Build(res, req.Query, extraSQL, extraArgs)
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

	descs := rows.FieldDescriptions()
	data := make([]json.RawMessage, 0)

	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			return query.DCollate[json.RawMessage]{}, err
		}
		obj := make(map[string]any)
		for i, fd := range descs {
			col := string(fd.Name)
			obj[col] = normalize(vals[i])
		}
		raw, err := json.Marshal(obj)
		if err != nil {
			return query.DCollate[json.RawMessage]{}, err
		}
		data = append(data, raw)
	}
	if err := rows.Err(); err != nil {
		return query.DCollate[json.RawMessage]{}, err
	}

	return query.DCollate[json.RawMessage]{
		Total:    total,
		Filtered: total,
		Data:     data,
		Query:    req.Query,
		Summary:  map[string]int{},
	}, nil
}

func normalize(v any) any {
	switch x := v.(type) {
	case []byte:
		return string(x)
	default:
		return x
	}
}

// Ping checks DB connectivity.
func (r *Runner) Ping(ctx context.Context) error {
	return r.pool.Ping(ctx)
}
