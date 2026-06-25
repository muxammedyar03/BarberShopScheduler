# Barber Queue — Architecture

## Stack

| Layer | Tech |
|-------|------|
| UI | Next.js 15 (App Router) |
| Data access | `Collections.*` → HTTP → Go API |
| API | Go 1.23, sqlc queries, dynamic **collate** (DQuery) |
| DB | PostgreSQL 16 |
| Cache | Redis 7 (collate responses, TTL 60s) |

## Data flow

```
Server Component / Client
    Collections.barbers.collate(query)     // Next adapter
        → POST /api/v1/collate/barbers   // Go API
            → Redis? → miss → PostgreSQL
            → DCollate { total, data, query }
        → mapBarberFromDB()              // snake_case → camelCase
```

## DQuery (Link_app style)

Same shape as `hr_employees.ts` `createQuery()`:

- `from`, `size` — paging
- `fields[]` — `search`, `checkboxes`, `checkbuttons`, `range`, `sort`

Go builds **parameterized** SQL from allowlisted columns (`internal/collate/registry.go`).

## Usage examples

### Server Component

```tsx
import { Collections, createBarberListQuery } from '@/lib/collections';

export default async function BarbersPage() {
  const query = createBarberListQuery({ size: 20 });
  const collate = await Collections.barbers.list(query);
  return <pre>{JSON.stringify(collate.data, null, 2)}</pre>;
}
```

### Scoped helpers

```ts
await Collections.appointments.findByBarberId('b1', query);
await Collections.users.findByRole('admin');
await Collections.invoices.findByBarberId('b2');
```

## VPS deploy

```bash
docker compose up -d --build
# nginx: deploy/nginx.conf → api.barber.uz + barber.uz
```

## Next steps

- [x] PostgreSQL + Go API (Firebase olib tashlangan)
- [ ] Auth (JWT + `users` jadvali, staff login API)
- [ ] sqlc generated CRUD (hozir raw SQL mutations)
- [ ] SSE for queue updates
