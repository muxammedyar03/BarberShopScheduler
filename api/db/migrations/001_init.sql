-- Barber Queue CRM — PostgreSQL schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE barbers (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    phone           TEXT NOT NULL DEFAULT '',
    avatar          TEXT NOT NULL DEFAULT '',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_blocked      BOOLEAN NOT NULL DEFAULT false,
    working_hours   JSONB NOT NULL DEFAULT '{"start":"09:00","end":"18:00"}',
    working_days    INT[] NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL CHECK (status IN ('working', 'busy', 'resting_or_sick')),
    monthly_fee     BIGINT NOT NULL DEFAULT 0,
    billing_day     INT NOT NULL DEFAULT 1,
    payment_status  TEXT NOT NULL CHECK (payment_status IN ('paid', 'overdue')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        TEXT NOT NULL UNIQUE,
    display_name TEXT,
    photo_url    TEXT,
    role         TEXT NOT NULL CHECK (role IN ('client', 'barber', 'admin')),
    barber_id    TEXT REFERENCES barbers(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE appointments (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    barber_id       TEXT NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    client_name     TEXT NOT NULL,
    client_phone    TEXT NOT NULL DEFAULT '',
    start_time      TEXT NOT NULL,
    end_time        TEXT NOT NULL,
    date            DATE NOT NULL,
    category        TEXT NOT NULL CHECK (category IN ('adult', 'child')),
    status          TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
    payment_method  TEXT CHECK (payment_method IN ('cash', 'card', 'click')),
    price           BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    barber_id   TEXT NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    barber_name TEXT NOT NULL,
    amount      BIGINT NOT NULL,
    issue_date  DATE NOT NULL,
    due_date    DATE NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'overdue')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cash_logs (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    barber_id   TEXT NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount      BIGINT NOT NULL,
    category    TEXT NOT NULL,
    date        DATE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_barber_date ON appointments (barber_id, date);
CREATE INDEX idx_appointments_date_status ON appointments (date, status);
CREATE INDEX idx_invoices_barber ON invoices (barber_id);
CREATE INDEX idx_cash_logs_barber_date ON cash_logs (barber_id, date);
CREATE INDEX idx_barbers_status ON barbers (status);
CREATE INDEX idx_users_role ON users (role);
