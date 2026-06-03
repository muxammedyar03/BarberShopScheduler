-- name: GetAppointment :one
SELECT * FROM appointments WHERE id = $1;

-- name: ListAppointmentsByBarber :many
SELECT * FROM appointments
WHERE barber_id = $1
ORDER BY date ASC, start_time ASC;

-- name: CreateAppointment :one
INSERT INTO appointments (
    barber_id, client_name, client_phone, start_time, end_time,
    date, category, status, payment_method, price
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: UpdateAppointment :one
UPDATE appointments SET
    barber_id = $2,
    client_name = $3,
    client_phone = $4,
    start_time = $5,
    end_time = $6,
    date = $7,
    category = $8,
    status = $9,
    payment_method = $10,
    price = $11,
    updated_at = now()
WHERE id = $1
RETURNING *;
