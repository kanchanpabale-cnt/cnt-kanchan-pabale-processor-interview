# Server — SignaPay Card Processor API

Node.js 20+ · Express · TypeScript · Prisma · PostgreSQL · Zod · JWT.

> For repo-wide setup (database creation, seeding, demo accounts) see the [root README](../README.md). This file covers server-only concerns.

---

## Stack

| Area | Choice |
|---|---|
| Runtime | Node.js 20+, TypeScript (CommonJS output) |
| HTTP | Express |
| ORM | Prisma 5 with PostgreSQL |
| Validation | Zod on every request boundary |
| Auth | bcryptjs (cost 12) + jsonwebtoken + role-based middleware |
| Security | helmet, cors (locked to `CORS_ORIGIN`), express-rate-limit on `/auth/login` |
| File upload | multer (memory storage, 20 MB limit) |
| Parsers | `csv-parse`, `fast-xml-parser`, native JSON |
| Money | Prisma `Decimal` + `decimal.js` — no floats |
| Logging | pino with PAN redaction |
| Tests | Vitest + `@vitest/coverage-v8` + supertest |

---

## Running locally

The easiest path is from the repo root:

```sh
npm run dev        # starts server (:4000) + client (:5173) in parallel
```

Server-only:

```sh
npm run dev -w server          # tsx watch — auto-restarts on source change
```

Health check: [http://localhost:4000/health](http://localhost:4000/health).

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev -w server` | `tsx watch src/index.ts` |
| `npm run build -w server` | `tsc -p tsconfig.json` → `dist/` |
| `npm run start -w server` | Runs the compiled build |
| `npm run typecheck -w server` | `tsc --noEmit` |
| `npm test -w server` | Vitest (121 tests across 16 suites) |
| `npm run test:coverage -w server` | Vitest + v8 coverage |

---

## Folder structure

```
src/
├── index.ts               HTTP listener bootstrap
├── app.ts                 buildApp() — middleware + route wiring
├── config/env.ts          zod-validated environment
├── lib/
│   ├── prisma.ts          PrismaClient singleton (hot-reload safe)
│   ├── logger.ts          pino w/ PAN redaction
│   └── jwt.ts             sign/verify helpers
├── middleware/
│   ├── auth.ts            requireAuth + requireRole
│   ├── error.ts           HttpError + error/notFound handlers
│   ├── rateLimit.ts       5 login attempts/min/IP
│   └── requestTiming.ts   in-memory ring buffer → P95 latency for /public
├── validators/            zod schemas per resource — auth, card, transaction, report
├── routes/                Express routers — auth, card, transaction, report, public
├── controllers/           parse + delegate (NO business rules, NO DB calls)
│   ├── auth.controller.ts
│   ├── card.controller.ts
│   ├── transaction.controller.ts
│   ├── report.controller.ts
│   └── public.controller.ts
├── services/              business logic + DB
│   ├── auth.service.ts
│   ├── card.service.ts
│   ├── transaction.service.ts
│   ├── report.service.ts
│   ├── public.service.ts  showcase stats (unauthenticated)
│   └── ingestion/         csv/json/xml parsers + validator + ingestUpload
└── utils/                 cardType, maskPan, money (Decimal helpers)

tests/                     Vitest suites (see §Testing)
```

**Layer rules** (see [claude.md](claude.md) for more):

- Controllers are thin — parse → delegate → respond. No `if (...) throw` for domain reasons, no DB calls.
- Services own business logic, invariants, and cross-entity writes via `prisma.$transaction(...)`.
- Validators are one-file-per-resource, reused by all routes on that resource.

---

## Environment variables

Copy [.env.example](.env.example) to `.env` at the repo root. Required variables:

| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://apple@localhost:5432/cardprocessor?schema=public` | See [root README](../README.md#database-setup) for OS-specific formats |
| `PORT` | `4000` | HTTP listen port |
| `NODE_ENV` | `development` · `production` · `test` | |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separate for multiple |
| `JWT_SECRET` | 32+ random chars | Fail-closed at startup if shorter |
| `JWT_EXPIRES_IN` | `1h` | Any `ms`-compatible string |
| `BCRYPT_COST` | `12` | Lower for tests if needed |

`env.ts` validates this with zod — startup fails fast if anything is missing or malformed.

---

## API surface

All routes are prefixed `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | public | Liveness probe (no `/api` prefix) |
| GET | `/api/public/showcase-stats` | public | Unauthenticated aggregates for the login panel |
| POST | `/api/auth/login` | public | Email + password → JWT. Rate-limited 5/min/IP |
| GET | `/api/auth/me` | required | Current user |
| POST | `/api/auth/logout` | required | Client drops the token |
| GET | `/api/cards` | required | Paginated; filter `cardType`, search `q` (last4 / holderName) |
| GET | `/api/cards/:id` | required | Single card |
| POST | `/api/cards` | ADMIN | Create card + 1..N initial transactions in one DB txn |
| PUT | `/api/cards/:id` | ADMIN | Update `holderName`; optionally append a transaction via `amount`+`timestamp` |
| DELETE | `/api/cards/:id` | ADMIN | Delete card (transactions preserved with `cardId = null`) |
| GET | `/api/transactions` | required | Paginated; filter `status`, `cardId`, `cardType`, `from`, `to`, `minAmount`, `maxAmount` |
| POST | `/api/transactions/upload` | required | Multipart `file` — `.csv` / `.json` / `.xml` |
| GET | `/api/reports/summary` | required | KPI tile data |
| GET | `/api/reports/by-card` | required | Accepted volume grouped by card (top N) |
| GET | `/api/reports/by-card-type` | required | Accepted volume grouped by card type |
| GET | `/api/reports/by-day` | required | Accepted volume grouped by day (SQL `date_trunc`) |
| GET | `/api/reports/rejected` | required | Paginated rejected transactions + reasons |
| GET | `/api/reports/rejected-by-reason` | required | Rejected counts grouped by reason |

Every response with card detail returns `maskedNumber` (`**** **** **** 1234`) + `cardType` + `last4` — the full PAN never leaves the server.

---

## Ingestion pipeline

1. `POST /api/transactions/upload` receives the file via `multer` (memory storage, 20 MB limit).
2. Controller calls [`ingestUpload`](src/services/ingestion/index.ts), which enforces file presence + supported extension — controllers stay thin.
3. `detectFormat` dispatches to a parser by extension:
   - `.csv` → [csv.parser.ts](src/services/ingestion/csv.parser.ts) (`csv-parse`)
   - `.json` → [json.parser.ts](src/services/ingestion/json.parser.ts) (native)
   - `.xml` → [xml.parser.ts](src/services/ingestion/xml.parser.ts) (`fast-xml-parser`)
4. Every row runs through [validate.ts](src/services/ingestion/validate.ts):
   - PAN is 15 or 16 digits with a leading-digit match (3→Amex 15, 4/5/6→16)
   - Parseable ISO timestamp
   - Finite numeric amount
5. Accepted cards are upserted, then accepted rows bulk-inserted via `createMany`, then rejected rows written with a `rejectionReason`. Whole batch runs inside a single `prisma.$transaction`.

Rejection reasons: `MISSING_CARD_NUMBER`, `NON_NUMERIC_PAN`, `INVALID_LENGTH`, `UNRECOGNIZED_TYPE`, `INVALID_TIMESTAMP`, `INVALID_AMOUNT`.

Adding a new format = adding one parser file + one case in `detectFormat` + one entry in the dispatcher. See the Ingestion agent contract in [claude.md](claude.md).

---

## Security notes

- **Passwords** hashed with bcrypt (cost 12).
- **JWT** in `Authorization` header, 1h expiry; no refresh tokens in scope.
- **Rate limit**: 5 login attempts per minute per IP on `POST /api/auth/login`.
- **CORS**: locked to `CORS_ORIGIN` (client origin only).
- **helmet** on every response.
- **PAN masking**: every API response uses `maskPan(...)` — only `**** **** **** 1234` + card type leaves the server. pino's redact list covers `cardNumber` and `rawCardNumber` so PANs can't be logged accidentally.
- **RBAC**: `requireAuth` on all `/api/*` except login + public; `requireRole('ADMIN')` on card mutations.
- **Validation**: zod at every request boundary returns 400 with field-level errors.

**Intentional simplification**: full PANs are stored in the DB to keep the demo runnable end-to-end. In production this would be tokenized (Stripe-style vault) or encrypted at rest via KMS. The storage shape is deliberately isolated — only [services/ingestion/index.ts](src/services/ingestion/index.ts) and [services/card.service.ts](src/services/card.service.ts) touch the raw column, so the swap would be a contained change.

---

## Testing

Current coverage: **85.7%** statements / **83.2%** branches / **94.9%** functions / **85.7%** lines.

100% covered: `app.ts`, every route, every validator, `lib/jwt.ts`, all middleware, `auth.service.ts`, `utils/{maskPan,money}`. Remaining gaps are mostly in `ingestion/index.ts` (the full DB round-trip is only integration-tested via routes) and a few card.service edit/delete paths covered via controller tests.

### Patterns

- **Services**: unit-test with `vi.mock('../src/lib/prisma', ...)`. Stub `$transaction` to invoke its callback with a per-test tx object.
- **Controllers / routes**: integration-test with `supertest(buildApp())` — hits real middleware, validators, auth/RBAC, and controllers.
- **Middleware**: direct unit tests with fake `req` / `res` / `next`.
- **Timing middleware**: has an `__resetTiming()` hatch for deterministic P95 tests.

```sh
npm test -w server
npm run test:coverage -w server

# run a specific file
npx vitest run tests/validators.test.ts
```

See [claude.md](claude.md) for server-specific conventions, skills (`backend-dev`, `db-design`), and the API + Ingestion agent contracts.
