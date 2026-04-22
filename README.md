# SignaPay Card Processor

A fullstack demo of a simplified credit-card transaction processor — ingests CSV/JSON/XML files, validates & persists them, exposes a JWT-authenticated REST API, and renders a branded dashboard + reports UI.

![Stack](https://img.shields.io/badge/stack-React%2018%20%7C%20TypeScript%20%7C%20Node%2020%2B%20%7C%20Postgres-0E4C90)

**This README is an index.** For workspace-specific setup, architecture, and API details, see:

- 🖥️ [client/README.md](client/README.md) — React + Vite + Tailwind UI (port 5173)
- ⚙️ [server/README.md](server/README.md) — Express + Prisma API (port 4000)
- 🤖 [claude.md](claude.md) — conventions, domain rules, and agent contracts for AI-assisted contributions

---

## Stack

| Layer | Choice |
|---|---|
| Client | React 18, TypeScript, Vite, Tailwind, Zustand, React Router v6, Recharts |
| Server | Node.js 20+, Express, TypeScript, Zod, Prisma, bcryptjs, jsonwebtoken, multer, pino |
| Database | PostgreSQL via Prisma ORM |
| Tests | Vitest + supertest (server) · Jest + React Testing Library (client) |
| Tooling | npm workspaces, `concurrently`, `tsx` |

No Docker required. All scripts work identically on **macOS and Windows**.

---

## Prerequisites

- **Node.js >= 20** — check with `node -v`
- **PostgreSQL** running locally — any recent version (14+)
- **npm >= 9** — ships with Node 20

---

## Database setup

Pick the option that matches your environment. The end goal is a running Postgres server and a database named `cardprocessor` that the Prisma schema can connect to.

### Option A — Postgres.app (macOS, recommended)

1. Download from [postgresapp.com](https://postgresapp.com/) and drag to `/Applications`.
2. Open Postgres.app → click **Initialize** → the dock icon turns green when the server is running.
3. Add its CLI tools to `PATH` (one-time):
   ```sh
   sudo mkdir -p /etc/paths.d
   echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp
   ```
   Open a new terminal so the PATH change takes effect.
4. Create the database:
   ```sh
   createdb cardprocessor
   ```
5. Your `DATABASE_URL` (in `.env`):
   ```
   DATABASE_URL="postgresql://<your-mac-username>@localhost:5432/cardprocessor?schema=public"
   ```
   Postgres.app sets up a passwordless role matching your macOS user.

### Option B — Homebrew (macOS)

```sh
brew install postgresql@16
brew services start postgresql@16
createdb cardprocessor
```

`DATABASE_URL`: `postgresql://<your-mac-username>@localhost:5432/cardprocessor?schema=public`

### Option C — Windows (EnterpriseDB installer)

1. Download the installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/).
2. Run it — set a password for the `postgres` superuser when prompted. Remember this password.
3. Add `C:\Program Files\PostgreSQL\<version>\bin` to your PATH.
4. Open a new PowerShell / cmd:
   ```sh
   createdb -U postgres cardprocessor
   ```
   It'll prompt for the password you set in step 2.
5. `DATABASE_URL`: `postgresql://postgres:<your-password>@localhost:5432/cardprocessor?schema=public`

### Option D — Linux (Debian / Ubuntu)

```sh
sudo apt update
sudo apt install postgresql
sudo systemctl enable --now postgresql
sudo -u postgres createdb cardprocessor

# Create a user that matches your Linux login (easier than using the 'postgres' superuser):
sudo -u postgres createuser --superuser "$USER"
```

`DATABASE_URL`: `postgresql://<your-linux-username>@localhost:5432/cardprocessor?schema=public`

### Option E — Docker (portable, any OS)

```sh
docker run --name signapay-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cardprocessor \
  -p 5432:5432 \
  -d postgres:16

# verify:
docker exec signapay-pg psql -U postgres -d cardprocessor -c '\conninfo'
```

`DATABASE_URL`: `postgresql://postgres:postgres@localhost:5432/cardprocessor?schema=public`

---

### Verify the connection

```sh
psql "$DATABASE_URL" -c '\conninfo'
```

You should see `You are connected to database "cardprocessor"`. If this works, Prisma will too.

### Common errors

| Error | Cause | Fix |
|---|---|---|
| `role "<user>" does not exist` | Postgres has no matching user | Use your real shell username (`whoami`), or create a role: `psql -U postgres -c "CREATE ROLE <user> LOGIN SUPERUSER;"` |
| `password authentication failed` | Password in `DATABASE_URL` is wrong | Fix the password, or check `pg_hba.conf` allows `trust` for localhost |
| `connection refused` | Postgres isn't running | Start it: `brew services start postgresql@16` · `sudo systemctl start postgresql` · open Postgres.app · `docker start signapay-pg` |
| `database "cardprocessor" does not exist` | DB wasn't created | Re-run `createdb cardprocessor` |

---

## First run

```sh
cp .env.example .env              # edit DATABASE_URL + JWT_SECRET
npm install                        # installs both workspaces + generates Prisma client
npm run db:migrate                 # applies the Prisma schema to the database
npm run db:seed                    # creates demo users + ingests test/ files
npm run dev                        # server :4000, client :5173
```

Open http://localhost:5173 — the login form is prefilled with the admin credentials below.

---

## Demo accounts

Seeded by `npm run db:seed`:

| Email | Password | Role | Can |
|---|---|---|---|
| `admin@signapay.local` | `Admin123!` | ADMIN | Everything (CRUD cards, upload, view reports, access Settings) |
| `analyst@signapay.local` | `Analyst123!` | ANALYST | View + upload (no card mutations) |

Log in as admin to see the full experience. Log out and log in as analyst to see how role-based UI gating works (the "New card" button and row actions disappear).

---

## Project layout

```
/
├── package.json            npm workspaces, dev/db/build/test scripts
├── jest.config.cjs         root Jest config — delegates to client only
├── claude.md               AI-assisted contribution guidance (cross-cutting)
├── README.md               THIS FILE
├── data/    test/          provided sample transaction files
├── database/prisma/        schema.prisma, seed.ts, migrations/
├── client/                 React UI  → client/README.md
└── server/                 Express API → server/README.md
```

---

## Top-level scripts

| Command | What it does |
|---|---|
| `npm install` | Installs both workspaces + runs `prisma generate` |
| `npm run dev` | Starts server + client in parallel |
| `npm run build` | Type-checks and builds both workspaces |
| `npm run db:migrate` | Runs Prisma migrations (dev mode) |
| `npm run db:seed` | Seeds demo users + ingests `test/*` |
| `npm run db:reset` | Drops + recreates schema, then auto-seeds (**destructive**) |
| `npm run db:studio` | Opens Prisma Studio (web GUI) |
| `npm test` | Server (Vitest) **and** client (Jest + RTL) |
| `npm run test:server` | Server only |
| `npm run test:client` | Client only |
| `npm run test:coverage` | Coverage for both workspaces |
| `npm run typecheck` | `tsc --noEmit` in both workspaces |

---

## Decisions & tradeoffs

| Choice | Why | What I'd revisit |
|---|---|---|
| npm workspaces | Zero extra tooling; works Win/Mac | Turbo/pnpm for build caching once the repo grows |
| Express over Fastify | Familiar, adequate perf | Fastify for hot paths if throughput matters |
| Prisma `Decimal` for money | Float precision loss is a real bug class | Only tradeoff is slightly more boilerplate on serialization |
| Zustand only (no React Query) | User-specified stack | React Query for richer caching / refetch-on-focus |
| Store full PAN | Interview simplicity | Tokenization / KMS in production |
| Seed `test/` only | 30k+ rows would slow every re-seed | Make `data/` seeding a separate opt-in script |
| Jest on client, Vitest on server | Jest is the React ecosystem default; Vitest reads Vite config natively on the server | Unify on Vitest if the ESM story with Jest keeps getting in the way |

---

## Known limitations

- No refresh tokens — re-login after 1h.
- Reports run per-request (no caching). `by-day` uses raw SQL `date_trunc`.
- File upload is in-memory (multer memory storage). Swap to disk + streaming parsers for real production loads.
- No E2E tests — unit/integration coverage only.
- No user-management UI — add users by editing the seed.

---

## Contributing

See [claude.md](claude.md) for cross-cutting guidance and [client/claude.md](client/claude.md) / [server/claude.md](server/claude.md) for workspace-specific conventions, skills, and agent contracts.

---

## The original exercise

This repo started from a take-home interview scaffold. The original `README.md` content lives in the git history (commit `ea7560b` and earlier).
