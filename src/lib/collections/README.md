# Collections layer

Link_app `Collections.*` / `collate2` pattern for Barber Queue.

## collate — generic list + filters

```ts
import { Collections, createBarberListQuery } from '@/lib/collections';

const query = createBarberListQuery();
query.fields.find((f) => f.name === 'search')!.string = 'Шохрух';

const collate = await Collections.barbers.collate(query);
// or typed:
const barbers = await Collections.barbers.list(query);
```

## Ready-made methods

| Collection | Method |
|------------|--------|
| `barbers` | `list()`, `findById()`, `findByStatus()`, `activeOnly()` |
| `appointments` | `findByBarberId()`, `listByBarberId()` |
| `users` | `findByRole()`, `findByEmail()`, `findByCompanyId()` |
| `invoices` | `findByBarberId()` |
| `cashLogs` | `findByBarberId()` |

## Adapters

Postgres returns `snake_case`; adapters map to `@/types` camelCase.
