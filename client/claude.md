# Claude guidance — Client workspace

Guidance specific to the React / Vite / Tailwind UI. For cross-cutting rules (TS strict, domain rules, money handling) see [/claude.md](../claude.md).

---

## 1. Folder structure

```
client/
├── public/logo.svg                  canonical SignaPay brand asset
├── jest.config.cjs                  Jest + @swc/jest + jsdom
├── jest.setup.ts                    jest-dom matchers + RR/Recharts warning filters
├── jest.polyfills.cjs               injects __APP_API_BASE_URL__ for tests
└── src/
    ├── main.tsx                     bootstraps <RouterProvider />
    ├── design-system/               branded, reusable primitives
    │   ├── Button, Input, PasswordInput, Select, Card, Modal, Table, Badge
    │   ├── Toast (Toaster fixed + ToastList inline), Pagination
    │   └── Logo, SignaPayLogo, EmptyState
    ├── components/                  feature-specific composites
    │   ├── auth/LoginShowcase
    │   ├── layout/                  AppShell, Sidebar, TopBar
    │   ├── cards/                   CardForm, CardsTable, CardTypeBadge, CardBrandIcon
    │   ├── transactions/            TransactionsTable, UploadDropzone
    │   └── reports/                 ByCardChart, ByCardTable, ByCardTypeChart,
    │                                ByDayChart, RejectedByReasonChart, RejectedList
    ├── pages/                       one file per route
    │                                LoginPage, DashboardPage, CardsTransactionsPage,
    │                                CardFormPage, ReportsPage, SettingsPage
    ├── router/                      createBrowserRouter + RequireAuth / RequireRole guards
    ├── store/                       zustand: auth (persisted), ui (toasts)
    ├── actions/                     axios-wrapped API callers, one per resource
    ├── hooks/                       useAuth, useAsync
    ├── lib/                         axios instance, zod validators, formatters, pan.ts
    ├── types/api.ts                 server DTOs mirror
    └── styles/                      Tailwind + brand tokens
```

**Rule**: `design-system/` is reusable, brand-agnostic in spirit (just adopts SignaPay colors); `components/` is feature-specific. Never cross the line — if a "component" is reused in three features, promote it to `design-system/`.

---

## 2. Conventions

- **Validators mirror the server** — every form uses a zod schema in [lib/validators.ts](src/lib/validators.ts) that parallels a schema in `server/src/validators/`. Keep constants (`AMOUNT_MAX` etc.) identical.
- **Server data is fetched per-mount** via [hooks/useAsync.ts](src/hooks/useAsync.ts) wrapping an `actions/*` function. Zustand holds auth + UI state only — not server data.
- **Tailwind tokens only** — use `tailwind.config.ts` tokens in feature components. One-off brand gradients (the `LoginShowcase` glass panes) are the allowed exception.
- **Inline `ToastList` for login** — the login form renders a `<ToastList />` above "Welcome back." so auth errors appear next to the form, not buried behind the showcase. Everywhere else uses the fixed `<Toaster />` mounted by `AppShell`.
- **Dark logo variant** — use `<SignaPayLogo dark />` on anything with a navy/blue background (sidebar). The wordmark stays crisp at any size via inline SVG.

---

## 3. Skills

### `frontend-dev`
- **When**: adding/modifying pages, components, or design-system primitives.
- **Checklist**:
  1. Is this a reusable UI primitive? → put it in `design-system/`.
  2. Is this feature-specific composition? → put it in `components/<feature>/`.
  3. Does it fetch data? → add or reuse an `actions/*` function; wrap with `useAsync`.
  4. Does it mutate global state? → only auth/ui go in Zustand; server data should refetch.
  5. Validate every form with `lib/validators.ts`. Show `error` on the Input.
  6. Use Tailwind tokens — never raw hex values in components (allowed exception: `LoginShowcase`).
  7. For toasts near a form, embed `<ToastList />` inline instead of a fixed `<Toaster />`.

### `brand-dev`
- **When**: adjusting theme, logo, or brand assets.
- **Checklist**:
  1. Authenticated chrome (sidebar, etc.) uses `<SignaPayLogo />`.
  2. Primary blue is `#0E4C90` (Tailwind `brand-500` / `brand-600`). PAY cyan `#00A0DD` is logo-specific.
  3. Glass surfaces on the login showcase use `bg-white/*` + `backdrop-blur-*` + `border-white/*`.
  4. Don't hardcode hex values in feature components — promote to `tailwind.config.ts` or use existing tokens.

---

## 4. UI agent contract

- **Input**: a page/component spec (route, data it shows, actions it exposes).
- **Output**: a page in `pages/`, any needed feature components in `components/<feature>/`, new design-system primitives if truly reusable.
- **Definition of done**: page renders in dev server, forms validate via zod, empty/loading/error states all handled, follows the brand palette, toasts placed appropriately (inline for login, fixed for app chrome).

---

## 5. Testing

- Runner: **Jest 29** + **React Testing Library** + **@swc/jest** (see [jest.config.cjs](jest.config.cjs)).
- Test files colocated under `__tests__/` within each folder.
- [jest.polyfills.cjs](jest.polyfills.cjs) injects the `__APP_API_BASE_URL__` global that Vite sets at build time — so `lib/axios.ts` works under both Vite and Jest without `import.meta` parse errors.
- Suppress noise (React Router v7 future-flag warnings, Recharts 0-dimension warnings) via the `console.warn` filter in [jest.setup.ts](jest.setup.ts).
- When testing a component that fetches, mock the matching `actions/*` function with `jest.mock()`.
- When testing routed components, wrap in `<MemoryRouter>`.

```sh
npm test -w client           # run all
npm run test:coverage -w client
npx jest src/components/cards  # a specific folder
```
