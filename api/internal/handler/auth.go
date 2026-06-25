package handler

import (
	"context"
	"net/http"
	"strings"

	"github.com/barber-queue/api/internal/auth"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authUserResponse struct {
	ID          string  `json:"id"`
	Email       string  `json:"email"`
	DisplayName string  `json:"displayName"`
	PhotoURL    *string `json:"photoURL"`
	Role        string  `json:"role"`
	BarberID    *string `json:"barberId"`
}

type loginResponse struct {
	Token string           `json:"token"`
	User  authUserResponse `json:"user"`
}

type authContextKey struct{}

func (a *API) postLogin(w http.ResponseWriter, r *http.Request) {
	var body loginRequest
	if !decodeJSON(w, r, &body) {
		return
	}
	email := strings.TrimSpace(strings.ToLower(body.Email))
	if email == "" || body.Password == "" {
		writeError(w, http.StatusBadRequest, "email and password required")
		return
	}

	ctx := r.Context()
	var (
		id, displayName, role string
		photoURL            *string
		barberID            *string
		passwordHash        *string
	)

	err := a.pool.QueryRow(ctx, `
		SELECT id::text, COALESCE(display_name, ''), role, photo_url, barber_id, password_hash
		FROM users WHERE lower(email) = $1`,
		email,
	).Scan(&id, &displayName, &role, &photoURL, &barberID, &passwordHash)
	if err != nil || passwordHash == nil || *passwordHash == "" {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	if role != "barber" && role != "admin" {
		writeError(w, http.StatusForbidden, "staff login only")
		return
	}

	if !auth.CheckPassword(*passwordHash, body.Password) {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	barberIDStr := ""
	if barberID != nil {
		barberIDStr = *barberID
	}

	token, err := auth.IssueToken(id, email, role, barberIDStr, displayName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "token issue failed")
		return
	}

	writeJSON(w, http.StatusOK, loginResponse{
		Token: token,
		User: authUserResponse{
			ID:          id,
			Email:       email,
			DisplayName: displayName,
			PhotoURL:    photoURL,
			Role:        role,
			BarberID:    barberID,
		},
	})
}

func (a *API) getMe(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var barberID *string
	if claims.BarberID != "" {
		b := claims.BarberID
		barberID = &b
	}
	writeJSON(w, http.StatusOK, authUserResponse{
		ID:          claims.UserID,
		Email:       claims.Email,
		DisplayName: claims.DisplayName,
		Role:        claims.Role,
		BarberID:    barberID,
	})
}

func claimsFromRequest(r *http.Request) *auth.Claims {
	c, _ := r.Context().Value(authContextKey{}).(*auth.Claims)
	return c
}

func (a *API) withAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			writeError(w, http.StatusUnauthorized, "missing token")
			return
		}
		token := strings.TrimPrefix(header, "Bearer ")
		claims, err := auth.ParseToken(token)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}
		ctx := context.WithValue(r.Context(), authContextKey{}, claims)
		next(w, r.WithContext(ctx))
	}
}
