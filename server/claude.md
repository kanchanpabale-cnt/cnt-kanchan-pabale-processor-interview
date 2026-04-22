# Claude guidance — Server workspace

Guidance specific to the Express + Prisma API. For cross-cutting rules (TS strict, domain rules, money handling) see [/claude.md](../claude.md).

---

## 1. Folder structure

```
server/
├── tsconfig.json
├── vitest.config.ts
├── .env.example
├── src/
│   ├── index.ts                 HTTP listener
│   ├── app.ts                   buildApp() — middleware + route wiring
│   ├── config/env.ts            zod-validated environment
│   ├── lib/                     prisma (singleton), logger (pino), jwt
│   ├── middleware/              auth (requireAuth / requireRole),
│   │                            error (HttpError + handlers), rateLimit,
│   │                            requestTiming (P95 ring buffer)
│   ├── validators/              zod schemas per resource
│   │                            auth.ts, card.ts, transaction.ts, report.ts
│   ├── routes/                  Express routers — auth, card, transaction, report, public
│   ├── controllers/             parse + delegate — NO business rules, NO DB calls
│   ├── services/                business logic + DB
│   │   ├── auth.service.ts
│   │   ├── card.service.ts
│   │   ├── transaction.service.ts
│   │   ├── report.service.ts
│   │   ├── public.service.ts    showcase stats (unauthenticated)
│   │   └── ingestion/           csv/json/xml parsers + validator + ingestUpload
│   └── utils/                   cardType, maskPan, money (decimal.js helpers)
└── tests/                       vitest suites
```

---

## 2. Conventions

- **Controllers are thin** — parse input via a zod validator, delegate to a service, return the service result. **No DB access, no domain rules, no `throw new HttpError(...)` for domain-level concerns — all of that is service territory.** If a controller has an `if (...) throw`, it's almost always the wrong layer.
- **Services own business logic + DB** — including cross-entity transactions (`prisma.$transaction(...)`), invariants, and domain-level 4xx/409 errors (via `HttpError`).
- **Validators live in `validators/<resource>.ts`** — never inline zod schemas in controllers or services. One file per resource.
- **`ingestUpload` is the controller-facing entry** for file uploads — the transaction controller never does file-presence checks or `detectFormat`. Those live in [services/ingestion/index.ts](src/services/ingestion/index.ts).
- **Never log PANs**. `pino` is configured to redact `cardNumber` / `rawCardNumber` automatically — keep that list current.
- **Mask in every response** — use [`maskPan(...)`](src/utils/maskPan.ts). Full PAN must never leave the server.
- **Money** — operate via Prisma `Decimal` or `decimal.js`. Serialize with `Decimal.toFixed(2)`.
- **Cross-entity writes** go inside `prisma.$transaction(...)`. Card creation with 1..N transactions and card edit appending a transaction both use this pattern.

---

## 3. Skills

### `backend-dev`
- **When**: adding/modifying API routes or server logic.
- **Checklist**:
  1. Add a zod schema in `validators/<resource>.ts`. Parse at the top of the controller.
  2. Controller delegates to `services/<resource>.service.ts`. **Never** put DB calls, business rules, or domain errors in a controller.
  3. Protect the route: `requireAuth` at minimum, `requireRole('ADMIN')` for mutations.
  4. Return masked PAN only — import from `utils/maskPan.ts`.
  5. For aggregations over money, use `Decimal.toFixed(2)` when serializing.
  6. Cross-entity writes go inside `prisma.$transaction(...)`.

### `db-design`
- **When**: changing the Prisma schema.
- **Checklist**:
  1. Money columns: `Decimal @db.Decimal(14, 2)`.
  2. Always add indexes for foreign-key + filter columns (`@@index`).
  3. Destructive changes (column drop, type change) need data migration first — Prisma blocks non-interactive `migrate dev` if there are non-null values to lose. Flow: `UPDATE ... SET col = NULL` via psql → `prisma migrate dev --create-only` → `prisma migrate deploy`.
  4. Update seed data if the change affects required columns.
  5. Run `npm run db:generate` to refresh the Prisma client.

---

## 4. Agents

### API agent
- **Input**: a route spec (method, path, auth, request shape, response shape).
- **Output**: a zod validator in `validators/<resource>.ts`, a service function, a thin controller, and a route registered in `app.ts`.
- **Definition of done**: `npm test -w server` passes, the new route returns masked PANs, 401 without token, 403 without required role, and the controller is purely parse+delegate+respond (no `throw` for domain reasons).

### Ingestion agent
- **Input**: a new source format (e.g. `.xlsx`).
- **Output**: a parser under [services/ingestion/](src/services/ingestion/) emitting the shared `RawRow` shape, wired into `detectFormat` + `parseByFormat`.
- **Definition of done**: parser has a vitest test covering a minimal round-trip; validate.ts and the rest of the pipeline need no changes.

---

## 5. Ingestion pipeline

1. `POST /api/transactions/upload` receives a file via `multer` (memory storage, 20 MB limit).
2. Controller calls [`ingestUpload`](src/services/ingestion/index.ts), which enforces file presence + supported extension.
3. `ingestUpload` dispatches to a parser by extension (`csv`/`json`/`xml`), each emitting the same `RawRow[]`.
4. Every row runs through [validate.ts](src/services/ingestion/validate.ts) which enforces the domain PAN + amount + timestamp rules.
5. Accepted cards are upserted, accepted transactions bulk-inserted via `createMany`, rejected rows inserted with a `rejectionReason`. Whole batch runs inside one Prisma `$transaction`.

Rejection reasons: `MISSING_CARD_NUMBER`, `NON_NUMERIC_PAN`, `INVALID_LENGTH`, `UNRECOGNIZED_TYPE`, `INVALID_TIMESTAMP`, `INVALID_AMOUNT`.

---

## 6. Testing

- Runner: **Vitest** + **@vitest/coverage-v8** + **supertest** (see [vitest.config.ts](vitest.config.ts)).
- Unit-test services with Prisma mocked via `vi.mock('../src/lib/prisma', ...)`. Stub `$transaction` to invoke its callback with a per-test tx object.
- Integration-test routes with `supertest(buildApp())` — hits real middleware, validators, auth/RBAC, and controllers.
- Request timing middleware has an `__resetTiming` hatch for deterministic tests.

```sh
npm test -w server
npm run test:coverage -w server
```
