# Spendify

Every bank in one place: what you **really** received, where it went, and what you kept.

Built for how people in Nigeria actually bank: several accounts and wallets, bank alerts as the
record of every transaction, and money moving between your own accounts all the time.

- **True Inflow** shows how much you actually received over 1, 2, 3 or 5 years or any calendar
  year. It leaves out transfers between your own banks, reversals, refunds, loans and savings
  coming back.
- **Overview** shows received vs really spent each month (self-transfers and savings never count
  as spending).
- **Transactions** covers every line from every statement, searchable and exportable.
- **Budgets** tracks monthly limits per category, with pace and suggestions from your usual spending.
- **Goals** shows savings targets and what each deadline needs per month.
- **Import** takes CSV statements (header row and columns detected automatically) or pasted SMS
  and email alerts. Re-importing never creates duplicates.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the landing page. With no environment variables set, Spendify runs
in **demo mode**, with five years of sample statements across four banks. There's no login and nothing
is saved (the app lives at `/overview`).

In live mode, visitors can still press **Try it with sample data** (`/demo`) to explore the demo
without an account. Nothing they change is saved.

## Use your own data (live mode)

Set `DATABASE_URL` to a Postgres database and Spendify switches to live mode, with email and
password accounts, where each person sees only their own data. That's the only variable. There's
no third-party auth service to set up.

**Locally:** copy `.env.example` to `.env.local`, set `DATABASE_URL`, then `npm run db:migrate` and
`npm run dev`.

## Deploy on Railway

1. In a Railway project, **New → GitHub Repo** and pick this repo. Railway detects Next.js and
   uses `railway.json` (start command, health check at `/api/health`).
2. **New → Database → PostgreSQL** in the same project.
3. In the app service → **Variables**, add `DATABASE_URL` with the value `${{Postgres.DATABASE_URL}}`
   (Railway's reference to the database's private URL).
4. Deploy. `npm start` applies any pending migrations, then starts the server, so the tables are
   created on the first deploy and kept up to date after that.
5. **Settings → Networking → Generate Domain** to get a public URL, then open it and create your account.

### Security

- Passwords are hashed with scrypt (`lib/auth/password.ts`). Sessions are random tokens in an
  httpOnly cookie, and only their SHA-256 hash is stored, so a leaked database can't be used to
  sign in.
- Failed sign-ins are rate limited per email and per IP (in memory, so per instance).
- Every database query is scoped to the signed-in user's id (`lib/data/repo.ts`). All writes are
  server actions validated with zod (`app/actions.ts`).
- Users can delete their account (Bank accounts page). That removes all of their banks,
  transactions, budgets, goals and sessions.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / apply migrations and serve |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm test` | Unit tests. Repository tests also run when `TEST_DATABASE_URL` is set |
| `npm run db:generate` | New migration after editing `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` (also runs on `npm start`) |

## Where things live

```
app/page.tsx        landing page (components/landing)
app/(app)/          the app: overview, transactions, inflow, budgets, goals, import, accounts
app/login           sign in / create account
app/demo            "try the demo" for visitors in live mode
app/api/health      health check for Railway
app/actions.ts      server actions (all writes, sign in/up/out)
lib/auth/           password hashing, sessions, rate limiting
lib/inflow/         True Inflow engine: transfer matching, exclusions, aggregation
lib/finance/        spending categories, received-vs-spent analysis, bank colours
lib/import/         CSV and alert parsers, dedupe fingerprints
lib/data/           workspace loader (demo or live) and database queries
lib/db/             Drizzle schema and client
drizzle/            SQL migrations (applied by scripts/migrate.mjs)
docs/DESIGN.md      design system
PLAN.md             product plan and roadmap
```
