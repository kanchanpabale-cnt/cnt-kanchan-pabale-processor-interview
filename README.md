# SignaPay Card Processor

A fullstack demo of a simplified credit-card transaction processor — ingests CSV/JSON/XML files, validates & persists them, exposes a JWT-authenticated REST API, and renders a branded dashboard + reports UI.

![Stack](https://img.shields.io/badge/stack-React%2018%20%7C%20TypeScript%20%7C%20Node%2020%2B%20%7C%20Postgres-0E4C90)

---

## Stack

| Layer | Choice |
|---|---|
| Client | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router v6, Recharts, lucide-react |
| Server | Node.js 20+, Express, TypeScript, Zod, Prisma, bcryptjs, jsonwebtoken, multer, pino |
| Database | PostgreSQL via Prisma ORM |
| Parsers | `csv-parse`, `fast-xml-parser`, native JSON |
| Money | `Decimal` (Prisma + `decimal.js`) — no floats anywhere |
| Tests | Vitest on the server, Jest + React Testing Library + `@swc/jest` on the client |
| Tooling | npm workspaces, `concurrently`, `tsx` |

---

## Prerequisites

- **Node.js** >= 20 (check with `node -v`)
- **PostgreSQL** running locally (Postgres.app, `brew install postgresql`, or equivalent)
- **npm** >= 9

No Docker required. All scripts work identically on **macOS and Windows**.

---

## Setup

### 1. Configure environment

```sh
cp .env.example .env
```

Edit `DATABASE_URL` if your Postgres isn't on the default port/user. Edit `JWT_SECRET` to something random and at least 32 chars.

### 2. Create the database

```sh
createdb cardprocessor
```

On Windows/psql:

```sh
psql -U postgres -c "CREATE DATABASE cardprocessor;"
```

### 3. Install dependencies + generate Prisma client

```sh
npm install
```

(`postinstall` runs `prisma generate` automatically.)

### 4. Migrate + seed

```sh
npm run db:migrate        # creates tables
npm run db:seed           # seeds users + ingests test/ files
```

### 5. Start dev servers

```sh
npm run dev
```

- **Client**: http://localhost:5173
- **Server**: http://localhost:4000 (health: http://localhost:4000/health)

---

## Demo accounts

Seeded by `npm run db:seed`:

| Email | Password | Role | Can |
|---|---|---|---|
| `admin@signapay.local` | `Admin123!` | ADMIN | Everything (CRUD cards, upload, view reports, access Settings) |
| `analyst@signapay.local` | `Analyst123!` | ANALYST | View + upload (no card mutations) |

---

## What to click

1. **Login** at `/login` (prefilled with admin creds). The password field has a show/hide toggle. Errors surface inline above the heading.
2. **Dashboard** — KPI tiles (volume, counts, rejected) with sparkbars + an authorization-activity area chart.
3. **Transactions** (`/transactions`) — unified cards & transactions workspace:
   - Drag-and-drop a file from `data/` (.csv, .json, or .xml) to ingest ~10k rows.
   - Filter by status, card type, card, date range, amount range.
   - Admin users see the **New card** button and row-level edit/delete actions.
   - `/cards` redirects here.
4. **Card form** (`/cards/new` · admin-only) — live PAN grouping (4-4-4-4 for Visa/MC/Discover, 5-5-5 for Amex), digit counter, brand icon lights up once the leading digit is recognized. One or more initial transactions can be added in the same form.
5. **Edit card** (`/cards/:id/edit` · admin-only) — update holder name; optionally append a new transaction (amount + datetime both required if either is provided).
6. **Reports** — volume by card type, by day, top cards by volume, rejected transactions grouped by reason.
7. **Settings** — profile + session info.
8. Log out, log in as the analyst — the **New card** button and row actions disappear.

---

## Project layout

```
/
├── package.json            npm workspaces, dev/db/build/test scripts
├── jest.config.cjs         root-level Jest config (delegates to client workspace)
├── claude.md               guidance for AI-assisted contributions
├── data/    test/          provided sample files
├── database/prisma/        schema.prisma, seed.ts, migrations/
├── server/                 Express + Prisma API (port 4000)
└── client/                 Vite + React UI (port 5173)
```

Client details (under `client/src/`):

- `design-system/` — branded primitives: Button, Input, PasswordInput, Select, Card, Badge, Table, Pagination, Toast/ToastList, Logo, SignaPayLogo, EmptyState.
- `components/` — feature composites: `auth/`, `layout/`, `cards/` (CardForm, CardsTable, CardBrandIcon, CardTypeBadge), `transactions/`, `reports/`.
- `pages/` — LoginPage, DashboardPage, CardsTransactionsPage, CardFormPage, ReportsPage, SettingsPage.
- `router/` — `createBrowserRouter` setup + `RequireAuth` / `RequireRole` guards.
- `store/` — Zustand stores for auth (persisted) and UI (toasts).
- `actions/` — typed axios wrappers per resource.
- `hooks/` — `useAuth`, `useAsync`.
- `lib/` — axios instance, zod validators (mirrored with server), formatters, PAN grouping helpers.
- `public/logo.svg` — canonical SignaPay brand mark.

See `claude.md` for full folder-level conventions (design-system vs components, services vs controllers, domain rules).

---

## API surface

All routes are prefixed `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | public | Email + password → JWT (rate-limited: 5 / min / IP) |
| GET | `/auth/me` | required | Current user |
| POST | `/auth/logout` | required | Client drops the token |
| GET | `/cards` | required | Paginated; filter by `cardType`, search `q` (last4 / holderName) |
| GET | `/cards/:id` | required | Single card |
| POST | `/cards` | ADMIN | Create with 1..N initial transactions in one DB transaction |
| PUT | `/cards/:id` | ADMIN | Update `holderName`; optionally append a transaction via `amount`+`timestamp` |
| DELETE | `/cards/:id` | ADMIN | Delete card (transactions are preserved with `cardId = null`) |
| GET | `/transactions` | required | Paginated; filter by `status`, `cardId`, `cardType`, `from`, `to`, `minAmount`, `maxAmount` |
| POST | `/transactions/upload` | required | Multipart `file` — .csv / .json / .xml |
| GET | `/reports/summary` | required | KPI tile data (cards, tx counts, batches, total volume) |
| GET | `/reports/by-card` | required | Accepted volume grouped by card (top N) |
| GET | `/reports/by-card-type` | required | Accepted volume grouped by card type |
| GET | `/reports/by-day` | required | Accepted volume grouped by day (SQL `date_trunc`) |
| GET | `/reports/rejected` | required | Paginated rejected transactions + reasons |
| GET | `/reports/rejected-by-reason` | required | Rejected counts grouped by reason |

---

## Domain rules

These are cross-cutting and encoded in both client and server validators — change one, update the other.

### Card number (PAN)

- Digits only; spaces are stripped on submit.
- **15 digits** if leading digit is `3` (Amex).
- **16 digits** if leading digit is `4` (Visa), `5` (MasterCard), or `6` (Discover).
- UI grouping: 5-5-5 for Amex, 4-4-4-4 for the others.
- Every API response masks to `**** **** **** 1234` + card type — the full PAN never leaves the server.

### Amount (manual entry)

- Up to 2 decimal places, sign allowed for refunds.
- `|amount| > 0` and `|amount| < 100_000` — shared `AMOUNT_MAX` constant, imported by both sides.
- UI shows `$` prefix + `USD` suffix.

### Amount (file ingestion)

- Accepts any finite numeric value including negatives and small / large magnitudes — refunds and legitimate high-value charges go through. Malformed rows are persisted with a rejection reason rather than dropped.

### Timestamp

- Anything the `Date` constructor can parse.
- Required on create; optional on update, but must travel with `amount` (either both provided or neither).

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts server + client in parallel (concurrently) |
| `npm run build` | Type-checks and builds both workspaces |
| `npm run db:migrate` | Runs Prisma migrations in dev mode |
| `npm run db:seed` | Re-seeds users + re-runs `test/` ingestion (idempotent) |
| `npm run db:reset` | Drops & recreates schema, then auto-seeds (destructive) |
| `npm run db:studio` | Opens Prisma Studio |
| `npm test` | Server (Vitest) **and** client (Jest + RTL) |
| `npm run test:server` | Just server |
| `npm run test:client` | Just client |
| `npm run test:coverage` | Coverage for both workspaces |
| `npx jest --coverage` | Client-only coverage (delegates via root `jest.config.cjs`) |
| `npm run typecheck` | `tsc --noEmit` in both workspaces |

---

## Ingestion pipeline

1. `POST /api/transactions/upload` receives a file via `multer` (memory storage, 20 MB limit).
2. The controller delegates to [`services/ingestion/ingestUpload`](server/src/services/ingestion/index.ts), which enforces file presence and supported extension — controllers stay thin.
3. `ingestUpload` → [`detectFormat`](server/src/services/ingestion/index.ts) → dispatch to the parser:
   - `.csv` → [csv.parser.ts](server/src/services/ingestion/csv.parser.ts) (`csv-parse`)
   - `.json` → [json.parser.ts](server/src/services/ingestion/json.parser.ts) (native)
   - `.xml` → [xml.parser.ts](server/src/services/ingestion/xml.parser.ts) (`fast-xml-parser`)
4. Every row runs through [validate.ts](server/src/services/ingestion/validate.ts):
   - PAN is 15 or 16 digits with a leading-digit match (3→Amex 15, 4/5/6→16)
   - Parseable ISO timestamp
   - Finite numeric amount
5. All unique accepted cards are upserted, then `Transaction.createMany` is used for accepted rows, then rejected rows are written with a `rejectionReason`. The whole batch runs inside a single Prisma `$transaction`.

Rejection reasons: `MISSING_CARD_NUMBER`, `NON_NUMERIC_PAN`, `INVALID_LENGTH`, `UNRECOGNIZED_TYPE`, `INVALID_TIMESTAMP`, `INVALID_AMOUNT`.

---

## Security notes

- **Passwords** hashed with bcrypt (cost 12).
- **JWT** in `Authorization` header, 1h expiry; no refresh tokens in scope.
- **Rate limit**: 5 login attempts per minute per IP.
- **CORS**: locked to `CORS_ORIGIN` (client origin only).
- **helmet** applied to all responses.
- **PAN masking**: every API response uses `maskPan(...)` — only `**** **** **** 1234` + card type leaves the server. Never log PANs (pino redact list covers `cardNumber` and `rawCardNumber`).
- **RBAC**: `requireAuth` on all `/api/*` except login; `requireRole('ADMIN')` on card mutations.
- **Validation**: zod at every request boundary returns 400 with field-level errors.

**Intentional simplification**: full PANs are stored in the DB to keep the demo runnable end-to-end. In production this would be tokenized (Stripe-style vault) or encrypted at rest via KMS. The storage shape is deliberately isolated so only `services/ingestion/index.ts` and `services/card.service.ts` touch the raw column — a production swap would be a contained change.

---

## Testing

**Server** — [Vitest](https://vitest.dev) with `@vitest/coverage-v8`:

```sh
npm run test:server           # 116 tests across 15 suites
npm run test:coverage -w server
```

Current coverage: **85.7%** statements / **83.2%** branches / **94.9%** functions. Prisma is mocked per test; `supertest` exercises the real Express app through every route for auth / RBAC / validation paths.

**Client** — [Jest 29](https://jestjs.io) + [@testing-library/react](https://testing-library.com) + `@swc/jest`:

```sh
npm run test:client           # 201 tests across 33 suites
npm run test:coverage -w client
# or, from repo root — delegates via root jest.config.cjs:
npx jest --coverage
```

Current coverage: **78.4%** statements / **65.3%** branches / **76.3%** functions. 100% coverage on `actions/`, `store/`, `hooks/`, `router/guards`, `lib/` (pan, format, validators), and most of `design-system/`. The heavy page compositions (`CardsTransactionsPage`, `ReportsPage`, `SettingsPage`, `AppShell`) are smoke-tested; their business logic is covered indirectly via the action / store / validator tests they consume.

**`import.meta.env` note**: `client/src/lib/axios.ts` reads the API base URL through a build-time global (`__APP_API_BASE_URL__`) injected by Vite's `define` config and shimmed by `client/jest.polyfills.cjs` in tests — so the same file works under both Vite and Jest without `import.meta` parse errors.

---

## Decisions & tradeoffs

| Choice | Why | What I'd revisit |
|---|---|---|
| npm workspaces | Zero extra tooling install; works Win/Mac | Turbo/pnpm for build caching once the repo grows |
| Express over Fastify | Familiar, adequate perf | Fastify for hot paths if throughput matters |
| Prisma `Decimal` for money | Float precision loss is a real bug class | Only tradeoff is slightly more boilerplate on serialization |
| Zustand only (no React Query) | User-specified stack; Zustand + `useAsync` is sufficient here | React Query for richer caching / refetch-on-focus / mutation invalidation |
| Store full PAN | Interview simplicity | Tokenization / KMS in production |
| Seed `test/` only | 30k+ rows would slow every re-seed | Make `data/` seeding a separate opt-in script |
| Design-system split | Enforces brand consistency; fewer one-off Tailwind soups | The boundary shifts over time — be willing to promote/demote |
| Recharts | Good defaults + SSR-safe | Visx or D3 for genuinely custom vis |
| Jest on client, Vitest on server | Jest is the ecosystem default for React + RTL; Vitest reads Vite config natively on the server side | Unify on Vitest if the ESM story with Jest keeps getting in the way |
| Amount bounds on manual entry only | Ingestion must accept real-world refunds / large charges; manual entry is a demo input where $0 and huge values are user error | Revisit if manual entry ever becomes the primary flow |

---

## Known limitations

- No refresh tokens — re-login after 1h.
- Reports run per-request (no caching). `by-day` uses raw SQL for `date_trunc`; would move to a materialized view at scale.
- File upload is in-memory (multer memory storage) — a 200 MB CSV would OOM. Swap to disk storage + streaming parsers for real production loads.
- No E2E tests; server has comprehensive unit / integration coverage, client has component + logic coverage but no browser-driven flows.
- No user-management UI — add users by editing the seed or inserting directly.
- Client state for server data is fetched per-mount with no caching (by design — fits the "Zustand only" constraint).

---

## Contributing

See [claude.md](claude.md) for conventions, the domain-rule touch-point map, skills (`frontend-dev`, `backend-dev`, `db-design`, `brand-dev`), and agent contracts (API, UI, Validation, Brand).

---

## The original exercise

This repo started from a take-home interview scaffold. The original `README.md` content lives in the git history (commit `ea7560b` and earlier). This document replaces it with operational instructions for the completed implementation.
