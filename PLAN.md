# Spendify — Product & Build Plan

> Living document. Edit freely; each phase below should become issues/PRs.

## 1. Where we are today

A polished **frontend-only** Next.js 15 dashboard (Tailwind 4, shadcn/base-ui, Recharts):

- Pages: Dashboard (`/`), Transactions, Budgets, Goals
- All data comes from `lib/mockData.ts`; summary stats are **hard-coded strings** (e.g. `"₦2,847,500"`), not computed
- Currency is Naira (NGN) throughout, formatted ad hoc in several components
- No persistence, auth, API, tests, or data entry of any kind

Good news: the UI and the data types (`Transaction`, `Budget`, `Goal`) are a solid skeleton. The job now is to make it *real* and give it a reason to exist next to every other budgeting app.

## 2. The idea — sharpened

**Spendify is a money tracker built for how people in Nigeria actually spend.**

Generic budgeting apps (YNAB, Monarch, Copilot) assume US bank feeds, one currency, and stable prices. Our target user has:

- **Several bank/fintech accounts** (GTB, Access, Opay, Moniepoint, Kuda, PalmPay…) and no single view of them
- **Bank debit/credit alerts** (SMS/email) as the most reliable record of every transaction
- **High inflation** — last year's ₦50k food budget is meaningless this year
- **Naira + dollar** savings (domiciliary accounts, USD apps)
- Informal commitments: **ajo/esusu** contributions, family support ("black tax"), POS cash withdrawals

### Target user (v1)
Salaried or freelance 22–38 year old in Lagos/Abuja, 2–5 accounts, smartphone-first, wants to know *"where did my money go this month and am I actually saving?"*

### Positioning
> "See all your accounts in one place, know where every naira went, and save against inflation — not against last year's prices."

### Differentiators (what we build that others don't)
1. **Alert import** — paste/forward bank alert SMS or emails → auto-parsed transactions. Works on day one without bank API partnerships.
2. **Inflation-aware budgets** — budgets and goals can auto-adjust by CPI; show "real" vs nominal savings.
3. **Multi-currency net worth** — NGN + USD with live-ish FX rate, shown in either.
4. **Nigeria-native categories** — Data & Airtime, POS/Cash, Transfers to family, Ajo/Esusu, Generator/Fuel, etc.
5. **Smart categorisation** — rules first, LLM fallback for messy merchant strings ("POS/WEB PMT 00234 SHOPRITE LEKKI").

## 3. MVP scope (what "v1 works" means)

A user can:

1. Sign up / log in
2. Create accounts (bank, wallet, cash, USD) with opening balances
3. Add transactions three ways: **manual entry**, **CSV import** (bank statement), **paste bank alert**
4. Have transactions auto-categorised (editable, and edits teach a rule)
5. Set monthly budgets per category and see progress
6. Create savings goals and log contributions
7. See a dashboard where **every number is computed** from their real data

Explicitly **not** in v1: automatic bank sync, mobile app, shared/household accounts, investments, bill pay.

## 4. Architecture

| Concern | Choice | Why |
|---|---|---|
| App | Next.js 15 App Router (existing) | Keep; use Server Components + Server Actions for mutations |
| DB | Postgres (Supabase) | Managed, free tier, Row Level Security for per-user isolation |
| ORM / queries | Drizzle | Typed schema + migrations, lightweight |
| Auth | Supabase Auth (email magic link + Google) | Pairs with RLS, no extra service |
| Validation | Zod | Shared between forms and server actions |
| Money | Integer **kobo/cents** (`bigint`) + currency code | Never floats for money |
| Charts | Recharts (existing) | Keep |
| Categorisation | Rules engine → Claude API fallback | Cheap/deterministic first, AI for the long tail |
| Tests | Vitest (logic) + Playwright (flows) | |
| Deploy | Vercel + Supabase | |

### Data model (first cut)

```
users            id, email, base_currency, created_at
accounts         id, user_id, name, type(bank|wallet|cash|card), institution, currency, opening_balance_minor, archived
categories       id, user_id (null = system default), name, kind(income|expense|transfer), color, icon, parent_id
transactions     id, user_id, account_id, category_id, amount_minor (signed), currency, occurred_at,
                 description_raw, merchant, status(pending|cleared), source(manual|csv|alert|api), external_hash, notes
category_rules   id, user_id, match_type(contains|regex|merchant), pattern, category_id, priority
budgets          id, user_id, category_id, period(month), amount_minor, rollover bool, inflation_adjust bool
goals            id, user_id, name, icon, color, target_minor, currency, deadline, archived
goal_contributions id, goal_id, amount_minor, occurred_at, transaction_id?
fx_rates         date, base, quote, rate
```

- `external_hash` de-duplicates the same transaction arriving from CSV *and* an alert.
- Transfers between own accounts = two linked rows with a `transfer` category so they don't count as spend.
- Balances, budget "spent", stats, charts are **derived by queries**, never stored.

## 5. Roadmap

### Phase 0 — Foundations (≈1 week)
- [ ] Replace README with real project docs; add `.env.example`
- [ ] Add Vitest, Prettier, CI (lint + typecheck + test + build on PRs)
- [ ] `lib/money.ts`: single `formatMoney(minor, currency)` helper; replace all ad-hoc `₦` formatting
- [ ] Refactor pages to read through a data layer (`lib/data/*.ts`) — start by wrapping mock data, so swapping to DB later touches one place
- [ ] Compute summary stats/budget totals from transactions instead of hard-coded strings

### Phase 1 — Real data (≈2 weeks)
- [ ] Supabase project, Drizzle schema + migrations, seed script (port `mockData.ts` into seed)
- [ ] Auth: sign-in page, protected routes via middleware, RLS policies
- [ ] Accounts CRUD
- [ ] Transactions: add/edit/delete form (dialog), filters (date range, account, category, search), pagination server-side
- [ ] Budgets CRUD + monthly period selector
- [ ] Goals CRUD + contributions
- [ ] Empty states and onboarding (create first account → add first transaction)

### Phase 2 — Getting data in (the differentiator, ≈2 weeks)
- [ ] CSV import with column mapping + preview + dedupe (start with 2–3 common bank statement formats)
- [ ] **Bank alert parser**: paste one or many SMS/email alerts → parsed preview → confirm. Parser per bank, fixtures-driven tests
- [ ] Categorisation rules engine; "always categorise X as Y" from any edit
- [ ] LLM fallback categoriser for uncategorised rows (batched, cached per merchant string)

### Phase 3 — Insight (≈2 weeks)
- [ ] Monthly report: top categories, biggest changes vs last month, recurring charges detected
- [ ] Inflation-adjusted budgets & goal targets (monthly CPI table)
- [ ] NGN/USD net worth with daily FX rate
- [ ] Alerts: budget at 80%/100%, goal behind schedule (email to start)

### Phase 4 — Reach & retention (later)
- [ ] PWA (installable, offline read) — cheap path to "mobile app"
- [ ] Email-forwarding inbox (forward bank alert emails to `you@in.spendify…` → auto-import)
- [ ] Open-banking sync via a Nigerian aggregator (e.g. Mono) once the product has traction
- [ ] Shared budgets (couples/households), Ajo group tracking

## 6. Success metrics
- Activation: % of sign-ups who log ≥10 transactions in week 1
- Retention: % active in week 4
- Import share: % of transactions entered via CSV/alert vs manual (target > 60%) — proves the differentiator
- Categorisation accuracy: % of auto-categories the user doesn't change (target > 85%)

## 7. Risks & open questions
- **Alert formats vary and change** → per-bank parsers with fixture tests; graceful "couldn't parse, edit manually"
- **Privacy/trust** with financial data → RLS everywhere, no selling data, clear privacy page, consider NDPA compliance before public launch
- **Manual entry fatigue** is what kills budgeting apps → Phase 2 is the real product, don't let it slip
- Open questions for us to decide:
  1. Is Nigeria-first the positioning we want, or keep it currency-agnostic from day one? (Plan assumes NGN-first, multi-currency capable.)
  2. Supabase vs self-managed Postgres + Auth.js?
  3. Monetisation: free core + paid (auto-import, AI categorisation, reports) at ~₦2–3k/month?
  4. Web-only/PWA for v1, or is a native app a must?

## 8. Suggested next step
Start **Phase 0**: money helper + data layer + computed stats. It's small, it removes the biggest "fake" parts of the current UI, and it sets up the DB swap in Phase 1 without touching components twice.
