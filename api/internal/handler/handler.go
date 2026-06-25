package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/barber-queue/api/internal/cache"
	"github.com/barber-queue/api/internal/collate"
	"github.com/barber-queue/api/internal/query"
)

type API struct {
	collate *collate.Runner
	cache   *cache.Store
	pool    *pgxpool.Pool
}

func New(coll *collate.Runner, c *cache.Store, pool *pgxpool.Pool) *API {
	return &API{collate: coll, cache: c, pool: pool}
}

func (a *API) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", a.health)
	mux.HandleFunc("POST /api/v1/auth/login", a.postLogin)
	mux.HandleFunc("POST /api/v1/auth/register", a.postRegister)
	mux.HandleFunc("GET /api/v1/auth/me", a.withAuth(a.getMe))
	mux.HandleFunc("POST /api/v1/collate/{resource}", a.postCollate)
	mux.HandleFunc("GET /api/v1/barbers/{id}", a.getBarber)
	mux.HandleFunc("PUT /api/v1/barbers/{id}", a.putBarber)
	mux.HandleFunc("DELETE /api/v1/barbers/{id}", a.deleteBarber)
	mux.HandleFunc("POST /api/v1/barbers", a.postBarber)
	mux.HandleFunc("GET /api/v1/appointments/barber/{barberId}", a.listAppointmentsByBarber)
	mux.HandleFunc("POST /api/v1/appointments", a.postAppointment)
	mux.HandleFunc("PUT /api/v1/appointments/{id}", a.putAppointment)
	mux.HandleFunc("POST /api/v1/invoices", a.postInvoice)
	mux.HandleFunc("PUT /api/v1/invoices/{id}", a.putInvoice)
	mux.HandleFunc("POST /api/v1/cash_logs", a.postCashLog)

	// Client discovery (authenticated clients)
	mux.HandleFunc("POST /api/v1/client/barbers", a.withClient(a.getClientBarbers))
	mux.HandleFunc("GET /api/v1/client/barbers/{barberId}/slots", a.withClient(a.getBarberSlots))
	mux.HandleFunc("GET /api/v1/client/queue", a.withClient(a.getClientQueue))
	mux.HandleFunc("POST /api/v1/client/appointments", a.withClient(a.postClientAppointment))
	mux.HandleFunc("POST /api/v1/client/appointments/list", a.withClient(a.getClientAppointments))
	mux.HandleFunc("POST /api/v1/client/favorites/list", a.withClient(a.getClientFavorites))
	mux.HandleFunc("POST /api/v1/client/favorites", a.withClient(a.postClientFavorite))
	mux.HandleFunc("DELETE /api/v1/client/favorites/{barberId}", a.withClient(a.deleteClientFavorite))
	mux.HandleFunc("GET /api/v1/client/search-history", a.withClient(a.getClientSearchHistory))
	mux.HandleFunc("POST /api/v1/client/search-history", a.withClient(a.postClientSearchHistory))
	mux.HandleFunc("GET /api/v1/client/recent-barbers", a.withClient(a.getClientRecentBarbers))
	mux.HandleFunc("GET /api/v1/client/profile", a.withClient(a.getClientProfile))
	mux.HandleFunc("PUT /api/v1/client/profile", a.withClient(a.putClientProfile))
}

func (a *API) health(w http.ResponseWriter, r *http.Request) {
	if err := a.collate.Ping(r.Context()); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "degraded", "db": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (a *API) postCollate(w http.ResponseWriter, r *http.Request) {
	resource := r.PathValue("resource")
	var req query.CollateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	if a.cache != nil {
		key, err := a.cache.CollateKey(resource, req)
		if err == nil {
			var cached query.DCollate[json.RawMessage]
			if ok, _ := a.cache.GetJSON(ctx, key, &cached); ok {
				writeJSON(w, http.StatusOK, cached)
				return
			}
		}
	}

	result, err := a.collate.Run(ctx, resource, req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if a.cache != nil {
		if key, err := a.cache.CollateKey(resource, req); err == nil {
			_ = a.cache.SetJSON(ctx, key, result)
		}
	}

	writeJSON(w, http.StatusOK, result)
}

func (a *API) getBarber(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	req := query.CollateRequest{
		Query: query.DQuery{Type: "list", From: 0, Size: 1, Fields: []query.DField{}},
		Where: map[string]any{"id": id},
	}
	result, err := a.collate.Run(r.Context(), "barbers", req)
	if err != nil || len(result.Data) == 0 {
		writeError(w, http.StatusNotFound, "barber not found")
		return
	}
	writeJSON(w, http.StatusOK, result.Data[0])
}

func (a *API) listAppointmentsByBarber(w http.ResponseWriter, r *http.Request) {
	barberID := r.PathValue("barberId")
	from := parseIntDefault(r.URL.Query().Get("from"), 0)
	size := parseIntDefault(r.URL.Query().Get("size"), 50)

	req := query.CollateRequest{
		Query: query.DQuery{Type: "list", From: from, Size: size, Fields: []query.DField{}},
		Where: map[string]any{"barber_id": barberID},
	}
	result, err := a.collate.Run(r.Context(), "appointments", req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func parseIntDefault(s string, def int) int {
	var n int
	if _, err := fmt.Sscanf(s, "%d", &n); err != nil {
		return def
	}
	return n
}

// cors middleware
func WithCORS(next http.Handler, origins string) http.Handler {
	allowed := strings.Split(origins, ",")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		for _, o := range allowed {
			if strings.TrimSpace(o) == "*" || strings.TrimSpace(o) == origin {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
