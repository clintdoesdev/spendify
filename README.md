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

Open http://localhost:3000. With no environment variables set, Spendify runs in **demo mode**,
with five years of sample statements across four banks. There's no login and nothing is saved.

## Use your own data (live mode)

1. Create a project at [supabase.com](https://supabase.com) (the free tier is fine).
2. Copy `.env.example` to `.env.local` and fill in:

   | Variable | Where to find it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` / publishable key |
   | `DATABASE_URL` | Connect → Transaction pooler (port 6543), with your database password |

3. Create the tables: `npm run db:migrate`
4. In Supabase → Authentication → URL Configuration, set **Site URL** to your app's URL and add
   `http://localhost:3000/auth/callback` (and your production `/auth/callback`) to **Redirect URLs**.
5. Restart `npm run dev`. You'll be asked to sign in with an emailed link.

Setting the two `NEXT_PUBLIC_SUPABASE_*` values is what switches live mode on. They are baked in at
build time, so rebuild after changing them. `DATABASE_URL` is required in live mode.

### Security

- The app connects to Postgres as the table owner and scopes **every** query to the signed-in
  user's id (`lib/data/repo.ts`).
- Row level security is also enabled with owner-only policies (`drizzle/0001_row_level_security.sql`),
  so Supabase's public API can only ever reach a user's own rows.
- All writes are server actions validated with zod (`app/actions.ts`).
- `DATABASE_URL` is server-only.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm test` | Unit tests. Repository tests also run when `TEST_DATABASE_URL` is set |
| `npm run db:generate` | New migration after editing `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |

## Where things live

```
app/(app)/          pages behind the shared header (overview, transactions, inflow, budgets, goals, import, accounts)
app/login, app/auth sign-in page and magic-link callback
app/actions.ts      server actions (all writes)
middleware.ts       Supabase session refresh + sign-in redirect (live mode only)
lib/inflow/         True Inflow engine: transfer matching, exclusions, aggregation
lib/finance/        spending categories, received-vs-spent analysis, bank colours
lib/import/         CSV and alert parsers, dedupe fingerprints
lib/data/           workspace loader (demo or live) and database queries
lib/db/             Drizzle schema and client
drizzle/            SQL migrations
docs/DESIGN.md      design system
PLAN.md             product plan and roadmap
```
