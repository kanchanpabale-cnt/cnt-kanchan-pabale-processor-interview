# Client — SignaPay Card Processor UI

React 18 + Vite + TypeScript + Tailwind SPA. Talks to the Express API over JSON / JWT.

> For repo-wide setup (database, seeding, demo accounts) see the [root README](../README.md). This file covers client-only concerns.

---

## Stack

| Area | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite 5 |
| Styling | Tailwind CSS (brand tokens in [tailwind.config.ts](tailwind.config.ts)) |
| Routing | React Router v6 — `createBrowserRouter` + `RequireAuth` / `RequireRole` guards |
| State | Zustand (auth persisted, UI toasts) |
| HTTP | axios + per-resource action creators |
| Charts | Recharts + a hand-rolled SVG AreaChart on the dashboard |
| Icons | lucide-react |
| Fonts | `@fontsource/inter` + Inter Tight for headings |
| Tests | Jest 29 + @testing-library/react + @swc/jest + jsdom |

---

## Running locally

The easiest path is from the repo root:

```sh
npm run dev        # starts server (:4000) + client (:5173) in parallel
```

Client-only:

```sh
npm run dev -w client
```

Vite's dev server (port 5173) proxies `/api` → `http://localhost:4000`, so you don't need CORS enabled for local dev. Production builds read `VITE_API_BASE_URL` from `.env`; Jest injects a test-time value via [jest.polyfills.cjs](jest.polyfills.cjs).

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev -w client` | Vite dev server on :5173 |
| `npm run build -w client` | `tsc -b && vite build` — emits `dist/` |
| `npm run preview -w client` | Serves the production build locally |
| `npm run typecheck -w client` | `tsc --noEmit` |
| `npm test -w client` | Jest (203 tests across 33 suites) |
| `npm run test:coverage -w client` | Jest + v8 coverage report |
| `npm run test:watch -w client` | Jest in watch mode |

From the repo root, `npx jest --coverage` also works — the root `jest.config.cjs` delegates to this workspace.

---

## Folder structure

```
src/
├── main.tsx                   bootstraps <RouterProvider>
├── router/                    createBrowserRouter + RequireAuth / RequireRole guards
├── pages/                     one file per route
│   ├── LoginPage              split-pane login + showcase
│   ├── DashboardPage          KPI tiles + area chart
│   ├── CardsTransactionsPage  combined cards/tx management
│   ├── CardFormPage           new-card form (multi-transaction) + edit-card form
│   ├── ReportsPage            by-card, by-type, by-day, rejected-by-reason
│   └── SettingsPage           profile + session info
├── components/                feature-specific composites
│   ├── auth/                  LoginShowcase (right-pane glass illustration)
│   ├── layout/                AppShell, Sidebar, TopBar
│   ├── cards/                 CardForm, CardsTable, CardTypeBadge, CardBrandIcon
│   ├── transactions/          TransactionsTable, UploadDropzone
│   └── reports/               ByCardChart, ByCardTable, ByCardTypeChart,
│                              ByDayChart, RejectedByReasonChart, RejectedList
├── design-system/             brand-neutral primitives
│                              Button, Input, PasswordInput, Select, Card, Modal,
│                              Table, Badge, Pagination, Toast (Toaster + ToastList),
│                              Logo, SignaPayLogo, EmptyState
├── store/                     zustand: auth (persisted) + ui (toasts)
├── actions/                   axios wrappers per resource
│                              auth, card, transaction, report, public
├── hooks/                     useAuth, useAsync
├── lib/                       axios instance, zod validators, format helpers, pan.ts
├── types/api.ts               server DTO mirrors
├── styles/                    Tailwind directives + tokens
└── vite-env.d.ts              type refs for Vite + Testing Library
```

**Design-system vs components** — `design-system/` holds reusable primitives with no feature awareness. `components/<feature>/` holds composites for a specific domain. If a "component" gets used by three features, promote it.

---

## Environment variables

Placed in the repo root `.env` (Vite also checks `client/.env` as a fallback).

| Variable | Example | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | Falls back to `/api` (uses Vite's proxy) if unset |

Vite's `define` config transforms `VITE_API_BASE_URL` into the build-time constant `__APP_API_BASE_URL__` so [lib/axios.ts](src/lib/axios.ts) can read it without touching `import.meta` directly — this keeps the file Jest-friendly.

---

## Pages overview

| Route | Who can see | Notes |
|---|---|---|
| `/login` | public | split-pane; password show/hide toggle; inline toasts above "Welcome back." |
| `/` | auth | Dashboard with KPI tiles + trend chart |
| `/transactions` | auth | Unified cards + transactions workspace with filters + file upload |
| `/cards` | auth | Redirects to `/transactions` |
| `/cards/new` | ADMIN | New-card form with multi-transaction entry and live PAN formatting |
| `/cards/:id/edit` | ADMIN | Edit holder; optionally append a transaction |
| `/reports` | auth | By-type / by-day / top cards / rejected-by-reason |
| `/settings` | auth | Profile + session info |

Role gating lives in [router/guards.tsx](src/router/guards.tsx) on the routing side and in `useAuth().isAdmin` on the UI side.

---

## Form validation

Every form uses a zod schema in [lib/validators.ts](src/lib/validators.ts) that mirrors a schema in `server/src/validators/`. Shared constants (e.g. `AMOUNT_MAX`) are imported into both sides — change one place, change both.

Domain rules enforced by the client:

- **Card number**: 15 digits if leading is `3` (Amex), 16 digits if leading is `4/5/6`. Digits-only. Auto-groups as 5-5-5 (Amex) or 4-4-4-4 (others).
- **Amount**: up to 2 decimals, signed, `|v| != 0` and `|v| < 100,000`. `$` prefix + `USD` suffix in the UI.
- **Timestamp**: anything the `Date` constructor accepts; must pair with amount on edit.

Full rules + server touch-points are listed in [/claude.md §5](../claude.md).

---

## Testing

Current coverage: **78.4%** statements / **65.3%** branches / **76.3%** functions / **78.4%** lines.

100% covered: every `actions/*`, `store/*`, `hooks/*`, `router/guards`, `lib/` (pan, format, validators), and most of `design-system/`. Heavy page compositions (`CardsTransactionsPage`, `ReportsPage`, `SettingsPage`, `AppShell`) are smoke-tested; their logic is covered indirectly via action / store / validator tests they consume.

### Conventions

- Test files live under `__tests__/` folders alongside the code they cover (`components/cards/__tests__/CardForm.test.tsx`).
- Mock the matching `actions/*` module with `jest.mock()` when testing a component that fetches.
- Wrap routed components in `<MemoryRouter>`.
- `toBeInTheDocument` + other `@testing-library/jest-dom` matchers are registered in [jest.setup.ts](jest.setup.ts).
- Test-time noise (React Router v7 future-flag warnings, Recharts 0-dimension warnings) is filtered in the same setup file.

### Running

```sh
npm test -w client
npm run test:coverage -w client

# run a specific folder or file
npx jest src/components/cards
npx jest src/lib/__tests__/pan.test.ts
```

See [claude.md](claude.md) for component-specific conventions, skills (`frontend-dev`, `brand-dev`), and the UI agent contract.
