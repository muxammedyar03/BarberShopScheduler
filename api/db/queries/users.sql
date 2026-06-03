-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: ListUsersByRole :many
SELECT * FROM users WHERE role = $1 ORDER BY display_name ASC;

-- name: UpsertUser :one
INSERT INTO users (email, display_name, photo_url, role, barber_id)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (email) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    photo_url = EXCLUDED.photo_url,
    role = EXCLUDED.role,
    barber_id = EXCLUDED.barber_id,
    updated_at = now()
RETURNING *;
