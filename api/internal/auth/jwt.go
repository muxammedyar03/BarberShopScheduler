package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID      string `json:"uid"`
	Email       string `json:"email"`
	Role        string `json:"role"`
	BarberID    string `json:"barber_id,omitempty"`
	DisplayName string `json:"name"`
	jwt.RegisteredClaims
}

func Secret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "dev-only-change-me-use-32-char-minimum-secret!!"
	}
	return []byte(s)
}

func IssueToken(userID, email, role, barberID, displayName string) (string, error) {
	claims := Claims{
		UserID:      userID,
		Email:       email,
		Role:        role,
		BarberID:    barberID,
		DisplayName: displayName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID,
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(Secret())
}

func ParseToken(token string) (*Claims, error) {
	parsed, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return Secret(), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
