package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/barber-queue/api/internal/query"
	"github.com/barber-queue/api/internal/repository"
)

func (a *API) clientRepo() *repository.ClientRepo {
	return repository.NewClient(a.pool)
}

func (a *API) withClient(next http.HandlerFunc) http.HandlerFunc {
	return a.withAuth(func(w http.ResponseWriter, r *http.Request) {
		claims := claimsFromRequest(r)
		if claims == nil || claims.Role != "client" {
			writeError(w, http.StatusForbidden, "client access only")
			return
		}
		next(w, r)
	})
}

type discoverRequest struct {
	Query         query.DQuery `json:"query"`
	OnlyAvailable bool         `json:"onlyAvailable"`
	ClientCity    string       `json:"clientCity"`
}

func (a *API) getBarberSlots(w http.ResponseWriter, r *http.Request) {
	barberID := r.PathValue("barberId")
	date := r.URL.Query().Get("date")
	slots, err := a.clientRepo().BarberSlots(r.Context(), barberID, date)
	if err != nil {
		writeError(w, http.StatusNotFound, "barber not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"slots": slots, "barberId": barberID, "date": date})
}

func (a *API) getClientBarbers(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	var req discoverRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.Query.Size <= 0 {
		req.Query.Size = 12
	}

	city := strings.TrimSpace(req.ClientCity)
	if city == "" {
		prof, err := a.clientRepo().GetProfile(r.Context(), claims.UserID)
		if err == nil && prof.City != nil {
			city = strings.TrimSpace(*prof.City)
		}
	}

	result, err := a.clientRepo().DiscoverBarbers(r.Context(), repository.DiscoverParams{
		UserID:        claims.UserID,
		ClientCity:    city,
		OnlyAvailable: req.OnlyAvailable,
		Query:         req.Query,
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	a.invalidateCollate(w, r, "barbers")
	writeJSON(w, http.StatusOK, result)
}

func (a *API) getClientQueue(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	data, err := a.clientRepo().MyQueue(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (a *API) getClientAppointments(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	var req struct {
		Query query.DQuery `json:"query"`
	}
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.Query.Size <= 0 {
		req.Query.Size = 20
	}
	result, err := a.clientRepo().MyHistory(r.Context(), claims.UserID, req.Query)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (a *API) postClientAppointment(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	var body repository.BookAppointmentInput
	if !decodeJSON(w, r, &body) {
		return
	}
	prof, err := a.clientRepo().GetProfile(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "profile not found")
		return
	}
	if body.ClientName == "" {
		body.ClientName = prof.DisplayName
	}
	if body.ClientPhone == "" && prof.Phone != nil {
		body.ClientPhone = *prof.Phone
	}
	id, err := a.clientRepo().BookAppointment(r.Context(), claims.UserID, body)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	a.invalidateCollate(w, r, "appointments")
	writeJSON(w, http.StatusOK, map[string]string{"id": id})
}

func (a *API) getClientFavorites(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	var req struct {
		Query query.DQuery `json:"query"`
	}
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.Query.Size <= 0 {
		req.Query.Size = 20
	}
	result, err := a.clientRepo().ListFavorites(r.Context(), claims.UserID, req.Query)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (a *API) postClientFavorite(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	var body struct {
		BarberID string `json:"barberId"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.BarberID == "" {
		writeError(w, http.StatusBadRequest, "barberId required")
		return
	}
	if err := a.clientRepo().AddFavorite(r.Context(), claims.UserID, body.BarberID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"barberId": body.BarberID})
}

func (a *API) deleteClientFavorite(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	barberID := r.PathValue("barberId")
	if barberID == "" {
		writeError(w, http.StatusBadRequest, "barberId required")
		return
	}
	if err := a.clientRepo().RemoveFavorite(r.Context(), claims.UserID, barberID); err != nil {
		writeError(w, http.StatusNotFound, "favorite not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"barberId": barberID})
}

func (a *API) getClientSearchHistory(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	data, err := a.clientRepo().ListSearchHistory(r.Context(), claims.UserID, 15)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (a *API) postClientSearchHistory(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	var body struct {
		Term string `json:"term"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if err := a.clientRepo().AddSearchTerm(r.Context(), claims.UserID, body.Term); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"term": strings.TrimSpace(body.Term)})
}

func (a *API) getClientRecentBarbers(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	data, err := a.clientRepo().RecentBarbers(r.Context(), claims.UserID, 8)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (a *API) getClientProfile(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	prof, err := a.clientRepo().GetProfile(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}
	writeJSON(w, http.StatusOK, prof)
}

func (a *API) putClientProfile(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	var body repository.ProfileUpdate
	if !decodeJSON(w, r, &body) {
		return
	}
	if err := a.clientRepo().UpdateProfile(r.Context(), claims.UserID, body); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	prof, _ := a.clientRepo().GetProfile(r.Context(), claims.UserID)
	writeJSON(w, http.StatusOK, prof)
}

// decodeDiscoverFromGET allows simple GET with empty body for queue/recent
func writeRawCollate(w http.ResponseWriter, data any) {
	raw, _ := json.Marshal(data)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(raw)
}
