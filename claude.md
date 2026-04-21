# Claude guidance — Card Processor

This file guides Claude (or another AI assistant) when making changes to this repo. Read it before proposing code.

---

## 1. Project overview

A fullstack demo of a simplified credit-card transaction processor:

- **Ingest** CSV / JSON / XML transaction files (formats in `data/` and `test/`).
- **Validate** each row (PAN format, leading-digit card type, amount, timestamp). Accepted rows are stored; rejected rows are persisted with a reason.
- **Persist** to PostgreSQL via Prisma. Money is `Decimal`, never `Float`.
- **Expose** a JWT-authenticated REST API (`/api/*`) with role-based access (ADMIN / ANALYST).
- **Render** a React + Tailwind UI with login, dashboard, combined cards+transactions view, reports, and settings.

Branding is SignaPay (logo in [public/logo.svg](client/public/logo.svg)). Primary blue is `#0E4C90`, logo accent `#00A0DD`, warm accent `#E2574C`, deep navy `#0A2540` still used for sidebar.

---

## 2. Architecture decisions

| Decision | Why |
|---|---|
| Monorepo via **npm workspaces** | Zero-install on mac/windows, no yarn/pnpm/turbo needed. |
| **Express + TS** server | Broad familiarity; performance is adequate for scope. |
| **Prisma `Decimal`** for money | Floats lose precision — banned here. Aggregations use `decimal.js`. |
| **Stateless JWT** auth | No session store; client holds the token in Zustand `persist`. |
| **Zustand** for client state | User-requested. Pair with axios + `useAsync` instead of React Query. |
| **Design-system vs. components** split | `design-system/` = branded primitives (Button, Input, Card, PasswordInput, Toast/ToastList, Logo, SignaPayLogo). `components/` = feature-specific composites. Never cross the line. |
| **Full PAN stored, masked in responses** | Interview simplicity. Production answer = tokenization / KMS encryption. See `server/src/utils/maskPan.ts` — responses must always use it. |
| **Ingestion pipeline dispatches by extension** | CSV / JSON / XML parsers all emit the same `RawRow` shape into a shared validator. Add a format by adding one parser. |
| **`ingestUpload` is the controller-facing service entry** | Controllers never do file-presence checks or `detectFormat` — both live in [services/ingestion/index.ts](server/src/services/ingestion/index.ts). |
| **Reports use SQL `date_trunc` for by-day** | Prisma `groupBy` can't bucket dates natively. Raw query is the clearest path. |
| **Seed ingests `test/` only** | `data/` is ~30k rows; uploaded via UI to demo the real flow. |
| **PAN grouping rule is encoded once** | [client/src/lib/pan.ts](client/src/lib/pan.ts) decides 15-digit Amex → 5-5-5, 16-digit others → 4-4-4-4. UI + tests import from there. |
| **Card creation = 1..N transactions in one tx** | `POST /api/cards` takes `transactions: [{amount, timestamp}]`. The service wraps `card.create` + `transaction.createMany` in a single Prisma `$transaction`. |
| **Edit card can append a transaction** | `PUT /api/cards/:id` accepts optional `amount`+`timestamp`; both must travel together. Appended under `status: ACCEPTED` in the same Prisma `$transaction` as the metadata update. |
| **Dollar amounts only** | Amount schema on both sides enforces `|v| !== 0` and `|v| < 100_000` with up to 2 decimal places. UI shows `$` prefix + `USD` suffix. Refunds still arrive via file ingestion (negative values accepted there). |
| **Login uses inline `ToastList`, not fixed `Toaster`** | Errors appear above "Welcome back." so they're visible in the form, not buried behind the showcase pane. |

---

## 3. Coding standards

- **TypeScript strict** is on in every workspace. No `any`. Prefer discriminated unions over `unknown` casts.
- **Zod at every boundary**: every route validates body/query via a schema in `server/src/validators/`. Every client form validates via `client/src/lib/validators.ts`. Keep the two in sync.
- **Controllers are thin** — parse input via a zod validator, delegate to a service, return the service result. **No DB access, no domain rules, no `throw new HttpError(...)` for domain-level concerns — all of that is service territory.** If a controller has an `if (...) throw`, it's almost always the wrong layer.
- **Services own business logic + DB** — including cross-entity transactions (`prisma.$transaction(...)`), invariants, and domain-level 4xx/409 errors (via `HttpError`).
- **Validators live in `server/src/validators/<resource>.ts`** — never inline zod schemas in controllers or services. One file per resource (`auth`, `card`, `transaction`, `report`).
- **Never log PANs**. `pino` is configured to redact `cardNumber` / `rawCardNumber` automatically — keep that list current.
- **Money**: only operate via `decimal.js` or Prisma `Decimal.toFixed(2)` for serialization. Never `Number(amount) + Number(...)`.
- **File naming**: kebab-case for non-React files (`auth.service.ts`), PascalCase for components (`CardForm.tsx`).
- **Imports**: no deep cross-workspace imports except the seed script (which intentionally reuses `server/src/services/ingestion`). Do not import `server/` from `client/` or vice versa.

---

## 4. Folder structure

```
/                       npm workspaces root
├── package.json        scripts, concurrently, tsx, prisma
├── .env.example        copy to .env (DATABASE_URL, JWT_SECRET, etc.)
├── data/               large sample files — uploaded via UI
├── test/               small sample files — loaded by seed
├── database/prisma/    schema.prisma, seed.ts, migrations/
├── server/
│   └── src/
│       ├── config/env.ts        zod-validated env
│       ├── lib/                 prisma, logger (pino), jwt
│       ├── middleware/          auth, rateLimit, error
│       ├── validators/          auth.ts, card.ts, transaction.ts, report.ts
│       ├── routes/              Express routers (thin)
│       ├── controllers/         parse + delegate (NO business rules)
│       ├── services/            business logic + DB
│       │   └── ingestion/       csv/json/xml parsers + validator + ingestUpload
│       ├── utils/               cardType, maskPan, money
│       └── index.ts / app.ts    server bootstrap
└── client/
    ├── public/logo.svg              canonical brand asset
    └── src/
        ├── design-system/           Button, Input, PasswordInput, Select, Card,
        │                            Modal, Table, Badge, Toast (+ ToastList),
        │                            Logo, SignaPayLogo, EmptyState
        ├── components/
        │   ├── auth/LoginShowcase
        │   ├── layout/              AppShell, Sidebar, TopBar
        │   ├── cards/               CardForm, CardsTable, CardTypeBadge,
        │   │                        CardBrandIcon
        │   ├── transactions/        TransactionsTable, UploadDropzone
        │   └── reports/             ByCardChart, ByCardTable, ByCardTypeChart,
        │                            ByDayChart, RejectedByReasonChart, RejectedList
        ├── pages/                   LoginPage, DashboardPage,
        │                            CardsTransactionsPage, CardFormPage,
        │                            ReportsPage, SettingsPage
        ├── router/                  createBrowserRouter + guards
        ├── store/                   zustand: auth, ui (toasts)
        ├── actions/                 axios-wrapped API callers
        ├── hooks/                   useAuth, useAsync
        ├── lib/                     axios instance, zod validators, formatters,
        │                            pan.ts (grouping rules)
        ├── types/api.ts             server DTOs mirror
        └── styles/                  Tailwind + tokens
```

---

## 5. Domain rules (must not drift)

These are cross-cutting rules that live in multiple files — change one, change them all.

### 5.1 Card number (PAN)
- Digits only.
- **15 digits** iff leading digit is `3` (Amex).
- **16 digits** iff leading digit is `4` (Visa), `5` (MasterCard), or `6` (Discover).
- Input display: 5-5-5 groups for Amex, 4-4-4-4 groups for the others.
- Stored verbatim; every API response returns only `maskedNumber` (`**** **** **** 1234`) + `cardType` + `last4`.
- Touch points:
  - [server/src/validators/card.ts](server/src/validators/card.ts) — `cardNumberSchema`
  - [client/src/lib/validators.ts](client/src/lib/validators.ts) — `cardNumberSchema`
  - [client/src/lib/pan.ts](client/src/lib/pan.ts) — `formatPan`, `expectedLength`, `groupSizeFor`
  - [server/src/utils/cardType.ts](server/src/utils/cardType.ts) — `detectCardType`

### 5.2 Amount
- String with up to 2 decimals, optional leading `-` (refunds come through ingestion).
- For manual card/transaction entry: `|amount| !== 0` and `|amount| < 100_000`.
- UI shows `$` prefix + `USD` suffix; `AMOUNT_MAX` is the shared source of truth.
- Touch points:
  - [server/src/validators/card.ts](server/src/validators/card.ts) — `amountSchema`
  - [client/src/lib/validators.ts](client/src/lib/validators.ts) — `amountSchema`, exported `AMOUNT_MAX`

### 5.3 Timestamp
- Must parse to a valid `Date`. Anything the `Date` constructor can interpret is accepted.
- Required on create; optional on update but **paired** with amount — both or neither.

### 5.4 Card entity
- No `nickname`. Don't add one without updating all read sites.
- `holderName` is optional metadata, editable.
- PAN is immutable once stored.

---

## 6. Skills

Lightweight working modes for common tasks.

### `frontend-dev`
- **When**: adding/modifying pages, components, or design-system primitives.
- **Checklist**:
  1. Is this a reusable UI primitive? → put it in `design-system/`.
  2. Is this feature-specific composition? → put it in `components/<feature>/`.
  3. Does it fetch data? → add or reuse an `actions/*` function; wrap with `useAsync`.
  4. Does it mutate global state? → only auth/ui go in Zustand; server data should refetch.
  5. Validate every form with `lib/validators.ts`. Show `error` on the Input.
  6. Use Tailwind tokens from `tailwind.config.ts` — never raw hex values in components (allowed exceptions: one-off brand gradients inside `LoginShowcase`).
  7. For toasts near a form, embed `<ToastList />` inline instead of a fixed `<Toaster />`.

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

### `brand-dev`
- **When**: adjusting theme, logo, or brand assets.
- **Checklist**:
  1. Logo in authenticated chrome (sidebar, etc.) → `<SignaPayLogo />` (renders the canonical SVG).
  2. Primary blue is `#0E4C90` (Tailwind `brand-500` / `brand-600`). PAY cyan `#00A0DD` is logo-specific.
  3. Glass surfaces on the login showcase use `bg-white/*` + `backdrop-blur-*` + `border-white/*`.
  4. Don't hardcode hex values in feature components — promote to `tailwind.config.ts` or use existing tokens.

---

## 7. Agents

Sub-agent-style contracts for scoped work.

### API agent
- **Input**: a route spec (method, path, auth, request shape, response shape).
- **Output**: a zod validator in `validators/<resource>.ts`, a service function, a thin controller, and a route registered in `app.ts`.
- **Definition of done**: `npm test -w server` passes, the new route returns masked PANs, 401 without token, 403 without required role, and the controller is purely parse+delegate+respond (no `throw` for domain reasons).

### UI agent
- **Input**: a page/component spec (route, data it shows, actions it exposes).
- **Output**: a page in `pages/`, any needed feature components in `components/<feature>/`, new design-system primitives if truly reusable.
- **Definition of done**: page renders in dev server, forms validate via zod, empty/loading/error states all handled, follows the brand palette, toasts placed appropriately (inline for login, fixed for app chrome).

### Validation agent
- **Input**: a field spec (name, type, constraints).
- **Output**: a zod schema on the server, a mirrored schema on the client, UI error display.
- **Definition of done**: invalid submissions show inline errors on the client AND return 400 from the server. Shared constants (e.g. `AMOUNT_MAX`) live in one place and are imported by both sides.

### Brand agent
- **Input**: a visual change (palette tweak, logo placement, glassmorphism treatment).
- **Output**: updates to `tailwind.config.ts` tokens, the relevant design-system primitive, and any affected feature component.
- **Definition of done**: no new raw hex literals in feature components; `SignaPayLogo` is used wherever the canonical mark should appear; client build still succeeds.

---

## 8. Running locally

```sh
cp .env.example .env              # edit DATABASE_URL + JWT_SECRET
createdb cardprocessor            # requires Postgres.app or local postgres
npm install
npm run db:migrate                # creates tables
npm run db:seed                   # seeds users + ingests test/*
npm run dev                       # server :4000, client :5173
```

Default accounts:
- `admin@signapay.local` / `Admin123!` (ADMIN)
- `analyst@signapay.local` / `Analyst123!` (ANALYST)
