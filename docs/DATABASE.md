# Database — DBeaver va autentifikatsiya

## DBeaver (PostgreSQL)

Docker Compose dagi `postgres` servisi hostda **10110** portda ochiladi.

| Parametr | Qiymat |
|----------|--------|
| Host | `localhost` |
| Port | `10110` |
| Database | `barber_queue` |
| User | `barber` |
| Password | `barber` |
| JDBC URL | `jdbc:postgresql://localhost:10110/barber_queue` |

Manba: `docker-compose.yml` → `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `ports: "10110:5432"`.

> **Eslatma:** Agar `8080` yoki boshqa port band bo‘lsa, API `10120`, web `10130` ishlatiladi — bu Postgres portiga taalluqli emas.

## Staff login (JWT)

Demo hisoblar olib tashlandi. Xodimlar **Go API + PostgreSQL** orqali kiradi.

| Email | Rol | Barber ID |
|-------|-----|-----------|
| `admin@barbershop.local` | Super Admin | — |
| `barber@barbershop.local` | Мастер | `b1` |
| `barber2@barbershop.local` | Мастер | `b2` |

**Boshlang‘ich parol (seed):** `ChangeMe123!`

Parollar `users.password_hash` ustunida bcrypt bilan saqlanadi (`api/db/seed_users.sql`).

### Mavjud volume (DB allaqachon yaratilgan)

Yangi migration faqat birinchi `docker compose up` da avtomatik ishlaydi. Agar DB eski bo‘lsa, DBeaver yoki `psql` orqali qo‘lda bajaring:

```sql
-- api/db/migrations/002_users_auth.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));

-- keyin api/db/seed_users.sql
```

### Production

1. `JWT_SECRET` ni kamida 32 belgili tasodifiy qator qiling (`.env` va `docker-compose`).
2. Staff parollarini DBeaver orqali yangilang (yangi bcrypt hash) yoki keyingi admin panel orqali.
3. `ChangeMe123!` ni hech qachon productionda qoldirmang.

## Kirish oqimi

1. Brauzer → `POST /api/auth/login` (Next.js, httpOnly cookie `barber_token`)
2. Next → `POST /api/v1/auth/login` (Go API, JWT)
3. Middleware JWT ni tekshiradi — sahifa yangilanganda `/barber` yoki `/owner` saqlanadi
4. Chiqish → `POST /api/auth/logout`
