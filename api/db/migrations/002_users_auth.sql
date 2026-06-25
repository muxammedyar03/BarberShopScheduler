-- Staff authentication (barber, admin)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));
