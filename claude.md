# Claude guidance — Card Processor (root)

This is the **cross-cutting** guidance file. For workspace-specific conventions, skills, and agent contracts see:

- [client/claude.md](client/claude.md) — React + Tailwind UI
- [server/claude.md](server/claude.md) — Express + Prisma API

---

## 1. Project overview

A fullstack demo of a simplified credit-card transaction processor:

- **Ingest** CSV / JSON / XML transaction files (formats in `data/` and `test/`).
- **Validate** each row (PAN format, leading-digit card type, amount, timestamp). Accepted rows are stored; rejected rows are persisted with a reason.
- **Persist** to PostgreSQL via Prisma. Money is `Decimal`, never `Float`.
- **Expose** a JWT-authenticated REST API (`/api/*`) with role-based access (ADMIN / ANALYST) and a public showcase endpoint.
- **Render** a React + Tailwind UI with login, dashboard, combined cards+transactions view, reports, and settings.

Branding is SignaPay (logo in [client/public/logo.svg](client/public/logo.svg)). Primary blue is `#0E4C90`, logo accent `#00A0DD`, warm accent `#E2574C`, deep navy `#0A2540` still used for the sidebar.

---

## 2. Architecture decisions (cross-workspace)

| Decision | Why |
|---|---|
| Monorepo via **npm workspaces** | Zero extra install on mac/windows; no yarn/pnpm/turbo needed. |
| **Express + TS** server, **React + Vite + TS** client | Familiar stack; adequate perf for scope. |
| **Prisma `Decimal`** for money | Floats lose precision — banned. Aggregations use `decimal.js`. |
| **Stateless JWT** auth | No session store; client holds the token in Zustand `persist`. |
| **Full PAN stored, masked in responses** | Interview simplicity. Production answer = tokenization / KMS encryption. |
| **Ingestion pipeline dispatches by extension** | CSV / JSON / XML parsers emit the same `RawRow` shape into a shared validator. Add a format by adding one parser. |
| **Public showcase endpoint** | The login panel shows live aggregate stats (authorized volume, approval rate, P95 latency) without needing auth. |
| **Jest on client, Vitest on server** | Each runner fits its workspace best; root `jest.config.cjs` scopes Jest to the client only. |

Workspace-specific decisions live in [client/claude.md](client/claude.md) and [server/claude.md](server/claude.md).

---

## 3. Coding standards (both workspaces)

- **TypeScript strict** is on in every workspace. No `any`. Prefer discriminated unions over `unknown` casts.
- **Zod at every boundary**: server routes validate body/query via schemas in `server/src/validators/`; client forms validate via `client/src/lib/validators.ts`. Keep the two in sync — a field constraint change touches both sides.
- **Money**: only operate via `decimal.js` or Prisma `Decimal.toFixed(2)` for serialization. Never `Number(amount) + Number(...)`.
- **File naming**: kebab-case for non-React files (`auth.service.ts`), PascalCase for components (`CardForm.tsx`).
- **Imports**: no deep cross-workspace imports except the seed script (which intentionally reuses `server/src/services/ingestion`). Do not import `server/` from `client/` or vice versa.

---

## 4. Monorepo layout

```
/
├── package.json            npm workspaces, dev/db/build/test scripts
├── jest.config.cjs         root Jest config — delegates to client workspace only
├── claude.md               THIS FILE — cross-cutting guidance
├── README.md               project overview + database setup
├── data/    test/          provided sample files (CSV/JSON/XML)
├── database/prisma/        schema.prisma, seed.ts, migrations/
├── server/                 Express + Prisma API (port 4000)
│   ├── claude.md           server-specific conventions, skills, agents
│   └── README.md           server setup, API surface, security
└── client/                 Vite + React UI (port 5173)
    ├── claude.md           client-specific conventions, skills, agents
    └── README.md           client setup, pages, design system
```

---

## 5. Domain rules (must not drift)

These are cross-cutting — each rule lives in multiple files. Change one site, change them all.

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
- UI shows `$` prefix + `USD` suffix. `AMOUNT_MAX` is the shared source of truth.
- Touch points:
  - [server/src/validators/card.ts](server/src/validators/card.ts) — `amountSchema`
  - [client/src/lib/validators.ts](client/src/lib/validators.ts) — `amountSchema`, exported `AMOUNT_MAX`

### 5.3 Timestamp
- Anything the `Date` constructor can interpret is accepted.
- Required on create; optional on update but **paired** with amount — both or neither.

### 5.4 Card entity
- No `nickname`. Don't add one without updating all read sites.
- `holderName` is optional metadata, editable.
- PAN is immutable once stored.

---

## 6. Validation agent (cross-workspace)

When adding a new field, both sides must update together.

- **Input**: a field spec (name, type, constraints).
- **Output**: a zod schema on the server, a mirrored schema on the client, UI error display.
- **Definition of done**: invalid submissions show inline errors on the client AND return 400 from the server. Shared constants (e.g. `AMOUNT_MAX`) live in one place and are imported by both sides.

Other agents (API, UI, Brand) live in the workspace they operate on — see [server/claude.md](server/claude.md) and [client/claude.md](client/claude.md).

---

## 7. Running locally (quick start)

```sh
cp .env.example .env           # edit DATABASE_URL + JWT_SECRET
createdb cardprocessor         # see README.md for full DB setup
npm install
npm run db:migrate             # creates tables
npm run db:seed                # seeds users + ingests test/*
npm run dev                    # server :4000, client :5173
```

Default accounts:
- `admin@signapay.local` / `Admin123!` (ADMIN)
- `analyst@signapay.local` / `Analyst123!` (ANALYST)

For details — database setup variants, troubleshooting, API surface, testing — see the root [README.md](README.md) and the workspace READMEs ([client](client/README.md), [server](server/README.md)).
