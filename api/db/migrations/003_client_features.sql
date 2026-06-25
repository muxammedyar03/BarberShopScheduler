-- Client discovery platform — idempotent migration

ALTER TABLE barbers ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '';
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) NOT NULL DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_client_user_date ON appointments (client_user_id, date);

CREATE TABLE IF NOT EXISTS client_favorites (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    barber_id  TEXT NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, barber_id)
);
CREATE INDEX IF NOT EXISTS idx_client_favorites_user ON client_favorites (user_id);

CREATE TABLE IF NOT EXISTS client_search_history (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    term       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_search_history_user_created ON client_search_history (user_id, created_at DESC);

-- Seed barber cities
UPDATE barbers SET city = 'Ташкент' WHERE city = '' OR city IS NULL;

-- Demo client (password: ChangeMe123!)
INSERT INTO users (
    email, display_name, role, password_hash,
    first_name, last_name, phone, city, address, auth_provider, email_verified
)
VALUES (
    'client@barbershop.local',
    'Demo Client',
    'client',
    '$2b$10$uyhOCkn4eRuUJ1tMAfVZJODqln22ibJBQzRUdIyNrnWcnO5N1/OiO',
    'Demo',
    'Client',
    '+998901234567',
    'Ташкент',
    'ул. Навои, 12',
    'local',
    true
)
ON CONFLICT (email) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    auth_provider = EXCLUDED.auth_provider,
    email_verified = EXCLUDED.email_verified,
    updated_at = now();
