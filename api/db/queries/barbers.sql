-- name: GetBarber :one
SELECT * FROM barbers WHERE id = $1;

-- name: ListBarbers :many
SELECT * FROM barbers ORDER BY name ASC;

-- name: UpsertBarber :exec
INSERT INTO barbers (
    id, name, phone, avatar, is_active, is_blocked,
    working_hours, working_days, status, monthly_fee, billing_day, payment_status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    avatar = EXCLUDED.avatar,
    is_active = EXCLUDED.is_active,
    is_blocked = EXCLUDED.is_blocked,
    working_hours = EXCLUDED.working_hours,
    working_days = EXCLUDED.working_days,
    status = EXCLUDED.status,
    monthly_fee = EXCLUDED.monthly_fee,
    billing_day = EXCLUDED.billing_day,
    payment_status = EXCLUDED.payment_status,
    updated_at = now();

-- name: DeleteBarber :exec
DELETE FROM barbers WHERE id = $1;
