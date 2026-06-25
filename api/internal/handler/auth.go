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

type registerRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Phone     string `json:"phone"`
	City      string `json:"city"`
	Address   string `json:"address"`
}

func (a *API) postRegister(w http.ResponseWriter, r *http.Request) {
	var body registerRequest
	if !decodeJSON(w, r, &body) {
		return
	}
	email := strings.TrimSpace(strings.ToLower(body.Email))
	if email == "" || len(body.Password) < 6 {
		writeError(w, http.StatusBadRequest, "email and password (min 6 chars) required")
		return
	}

	hash, err := auth.HashPassword(body.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "hash failed")
		return
	}

	display := strings.TrimSpace(body.FirstName + " " + body.LastName)
	if display == "" {
		display = email
	}

	ctx := r.Context()
	var id string
	err = a.pool.QueryRow(ctx, `
		INSERT INTO users (
			email, display_name, role, password_hash,
			first_name, last_name, phone, city, address, auth_provider, email_verified
		) VALUES ($1,$2,'client',$3,$4,$5,$6,$7,$8,'local',false)
		RETURNING id::text`,
		email, display, hash, body.FirstName, body.LastName, body.Phone, body.City, body.Address,
	).Scan(&id)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			writeError(w, http.StatusConflict, "email already registered")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	token, err := auth.IssueToken(id, email, "client", "", display)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "token issue failed")
		return
	}

	writeJSON(w, http.StatusCreated, loginResponse{
		Token: token,
		User: authUserResponse{
			ID:          id,
			Email:       email,
			DisplayName: display,
			Role:        "client",
		},
	})
}

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

	if role != "barber" && role != "admin" && role != "client" {
		writeError(w, http.StatusForbidden, "invalid role")
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
