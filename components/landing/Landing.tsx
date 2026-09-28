import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  FileDown,
  KeyRound,
  LineChart,
  Repeat,
  ShieldCheck,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";

import { BankAvatar } from "@/components/ui/kit";
import { KNOWN_BANKS } from "@/lib/finance/banks";
import { formatNaira, formatNairaCompact, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

import { demoStats } from "./demoStats";

type Props = {
  /** A database is connected, so visitors can create accounts. */
  canSignUp: boolean;
  signedIn: boolean;
  deleted?: boolean;
};

const Wrap = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>
);

const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("text-[13px] font-medium tracking-[0.075em] text-ink-faint uppercase", className)}>{children}</p>
);

function PrimaryLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet px-7 text-[16px] font-medium text-white transition-colors hover:bg-violet-deep focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
    >
      {children}
    </Link>
  );
}

function TextLink({ href, children, inverse }: { href: string; children: React.ReactNode; inverse?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 text-[16px] font-medium underline decoration-1 underline-offset-[6px] transition-colors",
        inverse ? "text-white decoration-white/40 hover:decoration-white" : "text-ink decoration-ash hover:decoration-ink"
      )}
    >
      {children}
    </Link>
  );
}

export function Landing({ canSignUp, signedIn, deleted }: Props) {
  const stats = demoStats();
  const demoHref = canSignUp ? "/demo" : "/overview";
  const primary = signedIn
    ? { href: "/overview", label: "Open Spendify" }
    : canSignUp
      ? { href: "/login?mode=signup", label: "Create your account" }
      : { href: "/overview", label: "Open the demo" };
  const leftOut = stats.gross - stats.total;
  const ownMoves = stats.excluded.self_transfer.amount + stats.excluded.unlinked_own_account.amount;
  const growth = stats.previousTotal ? stats.total / stats.previousTotal - 1 : null;

  return (
    <div className="overflow-x-clip">
      {deleted && (
        <div className="bg-gain-wash py-2.5 text-center text-[14px] text-gain" role="status">
          Your account and all of its data have been deleted.
        </div>
      )}

      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-white/90 backdrop-blur-md">
        <Wrap className="flex h-[68px] items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Spendify home">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-violet text-[17px] font-bold text-white">S</span>
            <span className="text-[19px] font-bold tracking-[-0.01em]">spendify</span>
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
            {[
              ["#inflow", "True Inflow"],
              ["#import", "Import"],
              ["#how", "How it works"],
              ["#security", "Security"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-full px-4 py-2 text-[15px] text-ink-soft transition-colors hover:text-ink">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            {canSignUp && !signedIn && (
              <Link href="/login" className="hidden px-2 text-[15px] font-medium text-ink sm:inline">
                Sign in
              </Link>
            )}
            <Link
              href={primary.href}
              className="inline-flex h-10 items-center rounded-full bg-violet px-5 text-[15px] font-medium text-white transition-colors hover:bg-violet-deep"
            >
              {signedIn ? "Open Spendify" : canSignUp ? "Get started" : "Open the demo"}
            </Link>
          </div>
        </Wrap>
      </header>

      <main>
        {/* Hero */}
        <section className="pt-16 pb-14 text-center sm:pt-24 sm:pb-20">
          <Wrap>
            <p className="inline-flex items-center gap-2 rounded-full bg-violet-wash px-4 py-2 text-[14px] font-medium text-ink">
              <span className="size-1.5 rounded-full bg-violet" />
              Built for how Nigerians actually bank
            </p>
            <h1 className="mx-auto mt-7 max-w-5xl text-[clamp(2.9rem,8.4vw,6.6rem)] leading-[0.92] font-black tracking-[-0.045em] text-ink">
              Every bank.
              <br />
              One honest number.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-[18px] leading-relaxed text-ink-soft sm:text-[19px]">
              Spendify reads the statements and alerts from every account you use, takes out the money you only moved between
              them, and shows what you really received, spent and kept.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
              <PrimaryLink href={primary.href}>
                {primary.label} <ArrowRight className="size-4" />
              </PrimaryLink>
              {!signedIn && canSignUp && <TextLink href={demoHref}>Try it with sample data</TextLink>}
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-[14px] text-ink-faint">
              <KeyRound className="size-4" /> No internet banking login. Ever.
            </p>
          </Wrap>
        </section>

        {/* Product as hero, floating on the lavender wash */}
        <section aria-label="Spendify preview" className="bg-violet-wash py-14 sm:py-20">
          <Wrap>
            <div className="relative mx-auto grid max-w-[1080px] grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <HeroCard stats={stats} growth={growth} />
              <div className="space-y-5 lg:pt-16">
                <ReconCard stats={stats} />
                {stats.example && <MatchChip example={stats.example} />}
              </div>
            </div>
            <p className="mt-8 text-center text-[13px] text-ink-faint">Figures from the sample data in the demo.</p>
          </Wrap>
        </section>

        {/* Banks */}
        <section className="py-14 sm:py-16">
          <Wrap className="flex flex-col items-center gap-6">
            <Eyebrow>Import from any Nigerian bank or wallet</Eyebrow>
            <ul className="flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-4">
              {KNOWN_BANKS.filter((b) =>
                ["GTBank", "Access Bank", "Zenith Bank", "UBA", "First Bank", "Kuda", "OPay", "Moniepoint", "PalmPay", "Wema Bank"].includes(b.name)
              ).map((bank) => (
                <li key={bank.name} className="flex items-center gap-2.5 text-[15px] text-ink-soft">
                  <BankAvatar account={{ institution: bank.name }} size={30} />
                  {bank.name}
                </li>
              ))}
            </ul>
          </Wrap>
        </section>

        {/* The problem, in numbers */}
        <section className="pb-20 sm:pb-28">
          <Wrap>
            <div className="rounded-[28px] bg-cloud px-6 py-12 sm:rounded-[36px] sm:px-14 sm:py-16">
              <Eyebrow>The problem</Eyebrow>
              <h2 className="mt-4 max-w-4xl text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.02] font-bold tracking-[-0.035em]">
                On paper, {formatNairaCompact(stats.gross)} came in. In reality it was {formatNairaCompact(stats.total)}.
              </h2>
              <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
                Salary lands in one bank, you move it to another to spend, then top up a wallet. Every hop looks like new
                money on a statement. Add them up and you&apos;ll think you earn far more than you do.
              </p>
              <dl className="mt-12 grid grid-cols-1 gap-8 border-t border-hairline pt-10 sm:grid-cols-3">
                <BigStat value={formatNairaCompact(ownMoves)} label="moved between the same person's accounts in a year" />
                <BigStat value={formatPercent(leftOut / stats.gross)} label="of all credits weren't income at all" />
                <BigStat value={String(stats.matchedTransfers)} label="transfers matched automatically, both sides" />
              </dl>
            </div>
          </Wrap>
        </section>

        {/* Z-pattern: True Inflow */}
        <Feature
          id="inflow"
          eyebrow="True Inflow"
          title="What you actually received. Over 1, 2 or 5 years."
          body="Spendify pairs every credit with the matching debit on your other accounts, then sets aside reversals, refunds, loans and your own savings coming back. What's left is real income, split by salary, business, family and returns."
          points={[
            "Compare any year with the one before, before and after inflation",
            "See exactly what was left out, and flip anything we got wrong",
            "Download it as a statement for a landlord, lender or embassy",
          ]}
          visual={<ReviewMock stats={stats} />}
        />

        <Feature
          id="import"
          reverse
          eyebrow="Import"
          title="Drop in a statement. Or just paste your alerts."
          body="Spendify finds the transactions in a CSV statement even with account details above the table, and reads the SMS and email alerts you already get. You check everything before it's saved, and importing the same statement twice never duplicates a thing."
          points={["Header row, columns and date format detected for you", "Debit and credit alerts read line by line", "Skips opening balances and totals"]}
          visual={<ImportMock />}
        />

        <Feature
          eyebrow="Spending"
          title="Budgets that don't count your own transfers."
          body="Moving money to Kuda isn't spending. Neither is your PiggyVest savings. Spendify only counts what actually left your pocket, then shows each budget against an even pace through the month."
          points={["Categories for data and airtime, POS, family and more", "Suggestions from what you usually spend", "Goals that tell you what each deadline takes per month"]}
          visual={<BudgetMock />}
        />

        {/* Feature grid */}
        <section className="py-20 sm:py-28">
          <Wrap>
            <div className="max-w-2xl">
              <Eyebrow>Everything in one place</Eyebrow>
              <h2 className="mt-4 text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.04] font-bold tracking-[-0.03em]">
                The numbers your bank app won&apos;t give you.
              </h2>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Repeat, title: "Transfer matching", body: "Money you move between your own banks is paired up and ignored everywhere: income, spending and budgets." },
                { icon: TrendingUp, title: "Real growth", body: "Year-on-year income growth shown before and after inflation, so a raise that didn't keep up shows up honestly." },
                { icon: FileDown, title: "Proof of income", body: "Export every counted payment for any period as a clean statement you can hand over." },
                { icon: LineChart, title: "Received vs spent", body: "Twelve months of what came in and what really went out, side by side, month by month." },
                { icon: Target, title: "Goals that do the maths", body: "Set a target and a date. See the monthly amount it takes, next to what you usually keep." },
                { icon: Upload, title: "Every account", body: "Salary bank, spending account, wallets, business account. The more you add, the sharper it gets." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <Icon className="size-7 text-violet" strokeWidth={1.75} />
                  <h3 className="mt-5 text-[20px] font-bold tracking-[-0.01em]">{title}</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </Wrap>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 pb-20 sm:pb-28">
          <Wrap>
            <div className="text-center">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mx-auto mt-4 max-w-3xl text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.04] font-bold tracking-[-0.03em]">
                Three steps. About five minutes.
              </h2>
            </div>
            <ol className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { title: "Add your banks", body: "List every account and wallet you use, with a nickname so you can tell them apart." },
                { title: "Import", body: "Download a CSV statement from each bank, or paste the alerts you've received. Check, then save." },
                { title: "See what's real", body: "True Inflow, spending, budgets and goals, all worked out across every account at once." },
              ].map((step, i) => (
                <li key={step.title} className="rounded-[28px] bg-cloud p-7 sm:rounded-[36px] sm:p-9">
                  <span className="flex size-10 items-center justify-center rounded-full bg-ink text-[16px] font-semibold text-white">{i + 1}</span>
                  <h3 className="mt-6 text-[22px] font-bold tracking-[-0.01em]">{step.title}</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">{step.body}</p>
                </li>
              ))}
            </ol>
          </Wrap>
        </section>

        {/* Security: inverted section */}
        <section id="security" className="scroll-mt-20 bg-ink py-20 text-white sm:py-28">
          <Wrap className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
            <div>
              <Eyebrow className="text-ash">Security</Eyebrow>
              <h2 className="mt-4 text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.04] font-bold tracking-[-0.03em]">
                Your money data stays yours.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-ash">
                Spendify never connects to your bank. It only sees what you choose to import.
              </p>
            </div>
            <ul className="divide-y divide-white/10">
              {[
                ["No bank login", "We never ask for your internet banking username, password, PIN or OTP."],
                ["Passwords hashed", "Stored with scrypt. Nobody, including us, can read your password."],
                ["Sessions protected", "Sign-in tokens live in a secure cookie and are only ever stored as a hash."],
                ["Only you see your data", "Every query is tied to your account. Nothing is shared or sold."],
                ["Delete everything", "One click in Bank accounts removes your login and every transaction for good."],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-violet">
                    <Check className="size-3.5 text-white" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-[17px] font-semibold">{title}</p>
                    <p className="mt-1 text-[16px] leading-relaxed text-ash">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Wrap>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-20 sm:py-28">
          <Wrap className="max-w-[760px]">
            <div className="text-center">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="mt-4 text-[clamp(2rem,4.2vw,3rem)] leading-[1.05] font-bold tracking-[-0.03em]">Questions, answered.</h2>
            </div>
            <div className="mt-12 space-y-3">
              {[
                ["Do you need my internet banking login?", "No. You import statements you download from your bank, or paste the debit and credit alerts you already get. Spendify never connects to your bank."],
                ["Which banks work?", "Any bank or wallet that lets you export a CSV statement, plus pasted SMS and email alerts from any bank. Statements with Debit and Credit columns, or a single signed amount column, are read automatically."],
                ["What is True Inflow?", "The money you actually received over a period, across all your accounts, after removing transfers between your own accounts, reversals, refunds, loan disbursements and savings you withdrew."],
                ["How do you know a transfer was between my own accounts?", "When the same amount leaves one of your accounts and lands in another within two days, both sides are paired. Transfers sent in your own name from a bank you haven't added are flagged too. You can override any decision."],
                ["Can I try it before signing up?", "Yes. The demo has five years of sample statements across four banks. Nothing you change there is saved."],
                ["Can I delete my data?", "Yes. Remove a bank and its transactions at any time, or delete your whole account from the Bank accounts page."],
              ].map(([q, a]) => (
                <details key={q} className="group rounded-2xl bg-cloud px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium text-ink">
                    {q}
                    <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{a}</p>
                </details>
              ))}
            </div>
          </Wrap>
        </section>

        {/* Closing call to action */}
        <section className="bg-violet-wash py-20 text-center sm:py-28">
          <Wrap>
            <h2 className="mx-auto max-w-4xl text-[clamp(2.5rem,7vw,5.25rem)] leading-[0.95] font-black tracking-[-0.045em]">
              Stop guessing.
              <br />
              Start counting.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[18px] text-ink-soft">Bring in one statement and see your real number in minutes.</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
              <PrimaryLink href={primary.href}>
                {primary.label} <ArrowRight className="size-4" />
              </PrimaryLink>
              {!signedIn && canSignUp && <TextLink href={demoHref}>Explore the demo</TextLink>}
            </div>
          </Wrap>
        </section>
      </main>

      <footer className="bg-ink text-white">
        <Wrap className="py-14">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-[10px] bg-violet text-[17px] font-bold">S</span>
                <span className="text-[19px] font-bold">spendify</span>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-ash">Every bank in one place: what you really received, where it went, and what you kept.</p>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-[15px]">
              <p className="font-semibold">Product</p>
              <p className="font-semibold">Account</p>
              <a href="#inflow" className="text-ash hover:text-white">True Inflow</a>
              {canSignUp ? <Link href="/login" className="text-ash hover:text-white">Sign in</Link> : <span />}
              <a href="#import" className="text-ash hover:text-white">Import</a>
              {canSignUp ? <Link href="/login?mode=signup" className="text-ash hover:text-white">Create account</Link> : <span />}
              <a href="#security" className="text-ash hover:text-white">Security</a>
              <Link href={demoHref} className="text-ash hover:text-white">Demo</Link>
            </div>
          </div>
          <p className="mt-12 border-t border-white/10 pt-6 text-[14px] text-ash">© {new Date().getFullYear()} Spendify. Amounts in Nigerian naira.</p>
        </Wrap>
      </footer>
    </div>
  );
}

type Stats = ReturnType<typeof demoStats>;

function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="text-[44px] leading-none font-black tracking-[-0.04em] tabular-nums sm:text-[52px]">{value}</dd>
      <dd className="mt-3 max-w-[16rem] text-[16px] text-ink-soft">{label}</dd>
    </div>
  );
}

function Feature({
  id,
  eyebrow,
  title,
  body,
  points,
  visual,
  reverse,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-12 sm:py-16">
      <Wrap className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <div className={cn(reverse && "lg:order-2")}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-4 text-[clamp(1.9rem,3.8vw,2.9rem)] leading-[1.05] font-bold tracking-[-0.03em]">{title}</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">{body}</p>
          <ul className="mt-8 space-y-3.5">
            {points.map((p) => (
              <li key={p} className="flex gap-3 text-[16px] text-ink">
                <Check className="mt-0.5 size-5 shrink-0 text-violet" strokeWidth={2.25} />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className={cn("rounded-[28px] bg-violet-wash p-4 sm:rounded-[36px] sm:p-10", reverse && "lg:order-1")}>{visual}</div>
      </Wrap>
    </section>
  );
}

/** Headline card: the True Inflow figure with a single-series monthly bar chart. */
function HeroCard({ stats, growth }: { stats: Stats; growth: number | null }) {
  const max = Math.max(...stats.monthly.map((m) => m.total), 1);
  const w = 560;
  const h = 150;
  const gap = 10;
  const bar = (w - gap * (stats.monthly.length - 1)) / stats.monthly.length;
  const total = stats.total || 1;
  return (
    <div className="rounded-[24px] border border-hairline bg-white p-6 text-left shadow-float sm:rounded-[28px] sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] font-medium tracking-[0.075em] text-ink uppercase">
          <span className="size-1.5 rounded-full bg-violet" /> True Inflow
        </p>
        <span className="rounded-full bg-cloud px-3 py-1 text-[13px] text-ink-soft">Last 12 months</span>
      </div>
      <p className="mt-6 text-[15px] text-ink-soft">You actually received</p>
      <p className="mt-1 text-[clamp(2.2rem,6vw,3.6rem)] leading-none font-black tracking-[-0.045em] tabular-nums">{formatNaira(stats.total)}</p>
      {growth !== null && (
        <p className="mt-4 flex items-center gap-2 text-[14px] text-ink-soft">
          <span className="inline-flex h-7 items-center gap-1 rounded-full bg-gain-wash px-2.5 font-semibold text-gain">
            <ArrowUpRight className="size-3.5" strokeWidth={2.5} />
            {formatPercent(growth)}
          </span>
          vs the 12 months before
        </p>
      )}
      <svg viewBox={`0 0 ${w} ${h + 22}`} className="mt-8 w-full" role="img" aria-label="Monthly True Inflow over the last 12 months">
        {[0.5, 1].map((t) => (
          <line key={t} x1="0" x2={w} y1={h - h * t} y2={h - h * t} stroke="#e7e7e7" strokeWidth="1" />
        ))}
        <line x1="0" x2={w} y1={h} y2={h} stroke="#e7e7e7" strokeWidth="1" />
        {stats.monthly.map((m, i) => {
          const bh = Math.max((m.total / max) * (h - 6), 2);
          const x = i * (bar + gap);
          const r = Math.min(5, bar / 2);
          return (
            <g key={m.label}>
              <path
                d={`M${x},${h} V${h - bh + r} Q${x},${h - bh} ${x + r},${h - bh} H${x + bar - r} Q${x + bar},${h - bh} ${x + bar},${h - bh + r} V${h} Z`}
                fill={i === stats.monthly.length - 1 ? "#594ff4" : "#b8b3fb"}
              />
              {i % 2 === 0 && (
                <text x={x + bar / 2} y={h + 17} textAnchor="middle" fontSize="12" fill="#6f6f6f">
                  {m.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-6 flex h-2 w-full gap-[2px] overflow-hidden rounded-full">
        <div className="h-full rounded-l-full bg-violet" style={{ flexGrow: stats.bySource.salary }} />
        <div className="h-full bg-ink" style={{ flexGrow: stats.bySource.business }} />
        <div className="h-full rounded-r-full bg-ash" style={{ flexGrow: stats.bySource.family + stats.bySource.returns + stats.bySource.other }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-soft">
        <span><span className="mr-1.5 inline-block size-2 rounded-full bg-violet" />Salary {formatPercent(stats.bySource.salary / total)}</span>
        <span><span className="mr-1.5 inline-block size-2 rounded-full bg-ink" />Business {formatPercent(stats.bySource.business / total)}</span>
        <span><span className="mr-1.5 inline-block size-2 rounded-full bg-ash" />Other {formatPercent((stats.bySource.family + stats.bySource.returns + stats.bySource.other) / total)}</span>
      </div>
    </div>
  );
}

function ReconCard({ stats }: { stats: Stats }) {
  const rows = [
    ["Transfers between your accounts", stats.excluded.self_transfer.amount + stats.excluded.unlinked_own_account.amount],
    ["Savings & ajo payouts", stats.excluded.savings_return.amount],
    ["Reversals & refunds", stats.excluded.reversal.amount + stats.excluded.refund.amount],
  ] as const;
  return (
    <div className="rounded-[24px] bg-ink p-6 text-left text-white shadow-float sm:rounded-[28px] sm:p-7">
      <p className="text-[12px] font-medium tracking-[0.075em] text-ash uppercase">How we got there</p>
      <div className="mt-5 space-y-3 text-[14px]">
        <div className="flex justify-between gap-4">
          <span>Everything credited</span>
          <span className="tabular-nums">{formatNairaCompact(stats.gross)}</span>
        </div>
        {rows.map(([label, amount]) => (
          <div key={label} className="flex justify-between gap-4 text-ash">
            <span>{label}</span>
            <span className="text-white tabular-nums">− {formatNairaCompact(amount)}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-end justify-between border-t border-white/15 pt-4">
        <span className="text-[14px] text-ash">True Inflow</span>
        <span className="text-[26px] leading-none font-black tracking-[-0.03em] tabular-nums">{formatNairaCompact(stats.total)}</span>
      </div>
    </div>
  );
}

function MatchChip({ example }: { example: NonNullable<Stats["example"]> }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-hairline bg-white p-4 text-left shadow-float">
      <div className="flex -space-x-2">
        <span className="rounded-full ring-2 ring-white"><BankAvatar account={{ institution: example.from }} size={34} /></span>
        <span className="rounded-full ring-2 ring-white"><BankAvatar account={{ institution: example.to }} size={34} /></span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">Transfer matched</p>
        <p className="truncate text-[13px] text-ink-faint">
          {example.from} → {example.to} · not counted as income
        </p>
      </div>
      <span className="text-[15px] font-semibold tabular-nums">{formatNairaCompact(example.amount)}</span>
    </div>
  );
}

function ReviewMock({ stats }: { stats: Stats }) {
  const rows = [
    { bank: "Kuda", narration: "NIP TRF FROM CLINTON K/GTBANK", note: "Paired with GTBank", amount: stats.example?.amount ?? 350000, counted: false },
    { bank: "OPay", narration: "REVERSAL FAILED TRF TO CHIDI MOTORS", note: "Failed transfer bounced back", amount: 42500, counted: false },
    { bank: "Kuda", narration: "PIGGYVEST WITHDRAWAL", note: "Your own savings", amount: 280000, counted: false },
    { bank: "OPay", narration: "TRF FROM AMAKA E", note: "Counted by you", amount: 60000, counted: true },
  ];
  return (
    <div className="rounded-[24px] border border-hairline bg-white p-5 shadow-float sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[16px] font-bold">What we left out</p>
        <span className="rounded-full bg-cloud px-3 py-1 text-[13px] text-ink-soft">{stats.matchedTransfers} transfers</span>
      </div>
      <ul className="mt-4 divide-y divide-hairline">
        {rows.map((r) => (
          <li key={r.narration} className="flex items-center gap-3 py-3.5">
            <BankAvatar account={{ institution: r.bank }} size={30} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[12px] tracking-tight">{r.narration}</p>
              <p className="text-[13px] text-ink-faint">{r.note}</p>
            </div>
            <span className={cn("hidden text-[14px] font-semibold tabular-nums sm:inline", !r.counted && "text-ink-faint line-through decoration-ash")}>
              {formatNairaCompact(r.amount)}
            </span>
            <span
              className={cn(
                "inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[13px] font-medium",
                r.counted ? "bg-violet text-white" : "border border-violet text-violet"
              )}
            >
              {r.counted ? "Counted" : "Count it"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImportMock() {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-hairline bg-white p-5 font-mono text-[12px] leading-relaxed text-ink-soft shadow-float sm:p-6">
        <p className="mb-2 font-sans text-[13px] font-medium text-ink-faint">Pasted alert</p>
        Acct: 012****821
        <br />
        Amt: NGN850,000.00 CR
        <br />
        Desc: SALARY SEP 2026 BRIGHTWAVE
        <br />
        Date: 25-Sep-2026 10:14
      </div>
      <div className="flex justify-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-violet text-white">
          <ArrowRight className="size-4 rotate-90" />
        </span>
      </div>
      <div className="rounded-[24px] border border-hairline bg-white p-5 shadow-float sm:p-6">
        <div className="flex items-center justify-between text-[13px] text-ink-faint">
          <span>Ready to import</span>
          <span className="inline-flex items-center gap-1 text-gain">
            <ShieldCheck className="size-4" /> No duplicates
          </span>
        </div>
        {[
          ["25 Sep", "SALARY SEP 2026 BRIGHTWAVE", "+₦850,000", true],
          ["26 Sep", "BOLT RIDE LAGOS", "−₦3,500", false],
          ["26 Sep", "MTN DATA BUNDLE 25GB", "−₦12,000", false],
        ].map(([d, n, a, credit]) => (
          <div key={String(n)} className="mt-3 flex items-center gap-3 border-t border-hairline pt-3 first-of-type:border-t-0">
            <span className="w-14 shrink-0 text-[13px] text-ink-faint">{d}</span>
            <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{n}</span>
            <span className={cn("text-[14px] font-semibold tabular-nums", credit ? "text-gain" : "text-ink")}>{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetMock() {
  const rows = [
    { name: "Food & groceries", spent: 212_000, limit: 260_000 },
    { name: "Transport", spent: 52_300, limit: 110_000 },
    { name: "Data & airtime", spent: 44_100, limit: 45_000 },
  ];
  const pace = 0.75;
  return (
    <div className="rounded-[24px] border border-hairline bg-white p-5 shadow-float sm:p-6">
      <div className="flex items-baseline justify-between">
        <p className="text-[16px] font-bold">September budgets</p>
        <p className="text-[13px] text-ink-faint">Day 23 of 30</p>
      </div>
      <ul className="mt-5 space-y-5">
        {rows.map((r) => {
          const ratio = r.spent / r.limit;
          return (
            <li key={r.name}>
              <div className="flex items-baseline justify-between text-[14px]">
                <span className="font-medium">{r.name}</span>
                <span className="text-ink-faint tabular-nums">
                  {formatNairaCompact(r.spent)} of {formatNairaCompact(r.limit)}
                </span>
              </div>
              <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-hairline">
                <div className={cn("h-full rounded-full", ratio > pace + 0.1 ? "bg-warn" : "bg-violet")} style={{ width: `${ratio * 100}%` }} />
                <div className="absolute inset-y-0 w-0.5 bg-ink/40" style={{ left: `${pace * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 rounded-2xl bg-cloud px-4 py-3 text-[13px] text-ink-soft">
        ₦340k moved to Kuda and ₦45k saved to PiggyVest this month. Neither counts as spending.
      </p>
    </div>
  );
}
