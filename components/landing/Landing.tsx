import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileDown,
  KeyRound,
  LineChart,
  Lock,
  Repeat,
  ShieldCheck,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";

import { CountUp } from "@/components/motion/CountUp";
import { LogoMark } from "@/components/shell/AppHeader";
import { ThemeButton } from "@/components/theme/ThemeToggle";
import { BankAvatar, CoinsArt } from "@/components/ui/kit";
import { KNOWN_BANKS } from "@/lib/finance/banks";
import { formatNaira, formatNairaCompact, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

import { demoStats } from "./demoStats";
import { FloatingCta, NavShell, SpanDemo } from "./interactive";

type Props = {
  /** A database is connected, so visitors can create accounts. */
  canSignUp: boolean;
  signedIn: boolean;
  deleted?: boolean;
};

type Stats = ReturnType<typeof demoStats>;

const Wrap = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>
);

function Badge({ children, onForest }: { children: React.ReactNode; onForest?: boolean }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold tracking-[0.06em] uppercase",
        onForest ? "bg-white/10 text-lime" : "bg-brand-wash text-brand"
      )}
    >
      {children}
    </p>
  );
}

/** Lime pill (Wise primary CTA). On lime backgrounds it inverts to forest. */
function Cta({ href, children, inverse }: { href: string; children: React.ReactNode; inverse?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-[52px] items-center justify-center gap-2 rounded-full px-7 text-[16px] font-semibold transition-all duration-200 active:scale-[0.97]",
        inverse ? "bg-forest text-lime hover:bg-forest-deep" : "bg-lime text-forest hover:bg-lime-deep"
      )}
    >
      {children}
      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
    </Link>
  );
}

/** Underlined secondary action paired with a filled CTA. */
function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[16px] font-semibold text-ink underline decoration-lime decoration-2 underline-offset-[7px] transition-[text-decoration-color] hover:decoration-ink"
    >
      {children}
    </Link>
  );
}

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as React.CSSProperties;

export function Landing({ canSignUp, signedIn, deleted }: Props) {
  const stats = demoStats();
  const demoHref = canSignUp ? "/demo" : "/overview";
  const primary = signedIn
    ? { href: "/overview", label: "Open Spendify" }
    : canSignUp
      ? { href: "/login?mode=signup", label: "Create your account" }
      : { href: "/overview", label: "Open the demo" };
  const growth = stats.previousTotal ? stats.total / stats.previousTotal - 1 : null;

  return (
    <div className="overflow-x-clip">
      {deleted && (
        <div className="bg-gain-wash py-2.5 text-center text-[14px] font-medium text-gain" role="status">
          Your account and all of its data have been deleted.
        </div>
      )}

      <NavShell>
        <Wrap className="flex h-full items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Spendify home">
            <LogoMark />
            <span className="text-[21px] font-black tracking-[-0.045em]">spendify</span>
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-1 rounded-full bg-cloud p-1 lg:flex">
            {[
              ["#try", "How it works"],
              ["#features", "Features"],
              ["#security", "Security"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-4 py-2 text-[14px] font-semibold text-ink-soft transition-colors hover:bg-raised hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeButton />
            {canSignUp && !signedIn && (
              <Link href="/login" className="hidden rounded-full px-3 py-2 text-[15px] font-semibold text-ink hover:bg-cloud sm:inline">
                Log in
              </Link>
            )}
            <Link
              href={primary.href}
              className="inline-flex h-10 items-center rounded-full bg-lime px-5 text-[15px] font-semibold text-forest transition-colors hover:bg-lime-deep"
            >
              {signedIn ? "Open Spendify" : canSignUp ? "Sign up" : "Open demo"}
            </Link>
          </div>
        </Wrap>
      </NavShell>

      <main>
        {/* Hero */}
        <section className="relative pt-14 pb-16 text-center sm:pt-20 sm:pb-24">
          <Wrap>
            <div className="animate-rise">
              <Badge>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-brand" />
                </span>
                Built for how Nigerians actually bank
              </Badge>
            </div>
            <h1 className="mx-auto mt-8 max-w-[1100px] text-[clamp(3.1rem,11.5vw,9.4rem)] leading-[0.84] font-black tracking-[-0.055em] text-ink">
              <span className="block">
                {["EVERY", "BANK."].map((w, i) => (
                  <span key={w} className="inline-block animate-rise" style={{ animationDelay: `${120 + i * 90}ms` }}>
                    {w}
                    {i === 0 && " "}
                  </span>
                ))}
              </span>
              <span className="block">
                {["ONE", "HONEST", "NUMBER."].map((w, i) => (
                  <span key={w} className="inline-block animate-rise" style={{ animationDelay: `${300 + i * 90}ms` }}>
                    {w === "HONEST" ? <span className="mark-lime text-forest">{w}</span> : w}
                    {i < 2 && " "}
                  </span>
                ))}
              </span>
            </h1>
            <p className="mx-auto mt-9 max-w-[620px] animate-rise text-[18px] leading-relaxed text-ink-soft [animation-delay:620ms] sm:text-[20px]">
              Spendify reads the statements and alerts from every account you use, removes the money you only moved
              between them, and shows what you really received, spent and kept.
            </p>
            <div className="mt-10 flex animate-rise flex-col items-center justify-center gap-6 [animation-delay:720ms] sm:flex-row sm:gap-9">
              <Cta href={primary.href}>{primary.label}</Cta>
              {!signedIn && canSignUp && <TextLink href={demoHref}>Try it with sample data</TextLink>}
            </div>
            <ul className="mt-10 flex animate-fade flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[14px] font-medium text-ink-faint [animation-delay:900ms]">
              <li className="flex items-center gap-2">
                <KeyRound className="size-4 text-brand" /> No internet banking login
              </li>
              <li className="flex items-center gap-2">
                <Lock className="size-4 text-brand" /> Private to you
              </li>
              <li className="flex items-center gap-2">
                <Upload className="size-4 text-brand" /> Any Nigerian bank or wallet
              </li>
            </ul>
          </Wrap>
        </section>

        {/* Product stage: forest band in both themes */}
        <section aria-label="Spendify preview" className="relative bg-forest pt-16 pb-20 text-white sm:pt-20 sm:pb-28">
          <Wrap>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" data-reveal="scale">
              <HeroCard stats={stats} growth={growth} />
              <div className="space-y-5 lg:pt-14">
                <ReconCard stats={stats} />
                {stats.example && <TransferCard example={stats.example} />}
              </div>
            </div>
            <p className="mt-10 text-center text-[13px] text-forest-soft">
              Every figure on this page comes from the sample data in the demo.
            </p>
          </Wrap>
        </section>

        {/* Banks marquee */}
        <section className="border-b border-hairline py-12">
          <p className="text-center text-[13px] font-semibold tracking-[0.08em] text-ink-faint uppercase">
            Import statements and alerts from
          </p>
          <div className="mask-fade-x relative mt-7 overflow-hidden">
            <ul className="flex w-max animate-marquee gap-10 pr-10 hover:[animation-play-state:paused]">
              {[...KNOWN_BANKS, ...KNOWN_BANKS].map((bank, i) => (
                <li
                  key={`${bank.name}-${i}`}
                  aria-hidden={i >= KNOWN_BANKS.length}
                  className="flex shrink-0 items-center gap-3 text-[16px] font-semibold text-ink-soft"
                >
                  <BankAvatar account={{ institution: bank.name }} size={36} />
                  {bank.name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Interactive: the problem, in numbers */}
        <section id="try" className="scroll-mt-20 py-20 sm:py-28">
          <Wrap>
            <div data-reveal>
              <SpanDemo spans={stats.spans} />
            </div>
          </Wrap>
        </section>

        {/* Features, Z-pattern */}
        <div id="features" className="scroll-mt-20">
          <Feature
            badge="True Inflow"
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
            reverse
            badge="Import"
            title="Drop in a statement. Or just paste your alerts."
            body="Spendify finds the transactions in a CSV statement even with account details above the table, and reads the SMS and email alerts you already get. You check everything before it's saved, and importing the same statement twice never duplicates a thing."
            points={["Header row, columns and date format detected for you", "Debit and credit alerts read line by line", "Opening balances and totals skipped"]}
            visual={<ImportMock />}
          />
          <Feature
            badge="Spending"
            title="Budgets that don't count your own transfers."
            body="Moving money to Kuda isn't spending. Neither is your PiggyVest savings. Spendify only counts what actually left your pocket, then shows each budget against an even pace through the month."
            points={["Categories for data and airtime, POS, family and more", "Suggestions from what you usually spend", "Goals that tell you what each deadline takes per month"]}
            visual={<BudgetMock />}
          />
        </div>

        {/* Feature grid */}
        <section className="py-20 sm:py-28">
          <Wrap>
            <div className="max-w-3xl" data-reveal>
              <Badge>Everything in one place</Badge>
              <h2 className="mt-5 text-[clamp(2.2rem,5vw,4rem)] leading-[0.92] font-black tracking-[-0.045em]">
                The numbers your bank app won&apos;t give you.
              </h2>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Repeat, title: "Transfer matching", body: "Money you move between your own banks is paired up and ignored everywhere: income, spending and budgets." },
                { icon: TrendingUp, title: "Real growth", body: "Year-on-year income growth before and after inflation, so a raise that didn't keep up shows up honestly." },
                { icon: FileDown, title: "Proof of income", body: "Export every counted payment for any period as a clean statement you can hand over." },
                { icon: LineChart, title: "Received vs spent", body: "Twelve months of what came in and what really went out, side by side, month by month." },
                { icon: Target, title: "Goals that do the maths", body: "Set a target and a date. See the monthly amount it takes, next to what you usually keep." },
                { icon: Upload, title: "Every account", body: "Salary bank, spending account, wallets, business account. The more you add, the sharper it gets." },
              ].map(({ icon: Icon, title, body }, i) => (
                <div
                  key={title}
                  data-reveal
                  style={delay((i % 3) * 90)}
                  className="group rounded-[24px] bg-cloud p-7 transition-[transform,background-color] duration-300 hover:-translate-y-1 hover:bg-brand-wash"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-raised shadow-[0_0_0_1px_var(--hairline)] transition-colors duration-300 group-hover:bg-lime">
                    <Icon className="size-5 text-brand transition-colors group-hover:text-forest" strokeWidth={2} />
                  </span>
                  <h3 className="mt-6 text-[20px] font-bold tracking-[-0.02em]">{title}</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </Wrap>
        </section>

        {/* Steps */}
        <section className="pb-20 sm:pb-28">
          <Wrap>
            <div className="text-center" data-reveal>
              <Badge>Getting started</Badge>
              <h2 className="mx-auto mt-5 max-w-3xl text-[clamp(2.2rem,5vw,4rem)] leading-[0.92] font-black tracking-[-0.045em]">
                Three steps. About five minutes.
              </h2>
            </div>
            <ol className="relative mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6" data-reveal>
              <span aria-hidden className="grow-x absolute top-7 right-[16%] left-[16%] hidden h-[3px] rounded-full bg-lime md:block" />
              {[
                { title: "Add your banks", body: "List every account and wallet you use, with a nickname so you can tell them apart." },
                { title: "Import", body: "Download a CSV statement from each bank, or paste the alerts you've received. Check, then save." },
                { title: "See what's real", body: "True Inflow, spending, budgets and goals, worked out across every account at once." },
              ].map((step, i) => (
                <li key={step.title} className="relative text-center">
                  <span className="relative z-10 mx-auto flex size-14 items-center justify-center rounded-full bg-forest text-[22px] font-black text-lime ring-8 ring-canvas">
                    {i + 1}
                  </span>
                  <h3 className="mt-6 text-[22px] font-bold tracking-[-0.02em]">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-[16px] leading-relaxed text-ink-soft">{step.body}</p>
                </li>
              ))}
            </ol>
          </Wrap>
        </section>

        {/* Security: forest in both themes */}
        <section id="security" className="scroll-mt-16 bg-forest py-20 text-white sm:py-28">
          <Wrap className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-20">
            <div data-reveal>
              <Badge onForest>
                <ShieldCheck className="size-3.5" /> Security
              </Badge>
              <h2 className="mt-6 text-[clamp(2.6rem,6.4vw,5.4rem)] leading-[0.88] font-black tracking-[-0.05em] text-lime">
                YOUR MONEY DATA STAYS YOURS.
              </h2>
              <p className="mt-6 max-w-md text-[18px] leading-relaxed text-forest-soft">
                Spendify never connects to your bank. It only ever sees what you choose to import.
              </p>
            </div>
            <ul className="divide-y divide-white/10 self-center">
              {[
                ["No bank login", "We never ask for your internet banking username, password, PIN or OTP."],
                ["Passwords hashed", "Stored with scrypt. Nobody, including us, can read your password."],
                ["Sessions protected", "Sign-in tokens live in a secure cookie and are only ever stored as a hash."],
                ["Only you see your data", "Every query is tied to your account. Nothing is shared or sold."],
                ["Delete everything", "One click in Bank accounts removes your login and every transaction for good."],
              ].map(([title, body], i) => (
                <li key={title} data-reveal style={delay(i * 80)} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-lime">
                    <Check className="size-4 text-forest" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-[18px] font-bold">{title}</p>
                    <p className="mt-1 text-[16px] leading-relaxed text-forest-soft">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Wrap>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 py-20 sm:py-28">
          <Wrap className="max-w-[820px]">
            <div className="text-center" data-reveal>
              <Badge>FAQ</Badge>
              <h2 className="mt-5 text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.92] font-black tracking-[-0.045em]">Questions, answered.</h2>
            </div>
            <div className="mt-12 space-y-3" data-reveal>
              {[
                ["Do you need my internet banking login?", "No. You import statements you download from your bank, or paste the debit and credit alerts you already get. Spendify never connects to your bank."],
                ["Which banks work?", "Any bank or wallet that lets you export a CSV statement, plus pasted SMS and email alerts from any bank. Statements with Debit and Credit columns, or a single signed amount column, are read automatically."],
                ["What is True Inflow?", "The money you actually received over a period, across all your accounts, after removing transfers between your own accounts, reversals, refunds, loan disbursements and savings you withdrew."],
                ["How do you know a transfer was between my own accounts?", "When the same amount leaves one of your accounts and lands in another within two days, both sides are paired. Transfers sent in your own name from a bank you haven't added are flagged too. You can override any decision."],
                ["Can I try it before signing up?", "Yes. The demo has five years of sample statements across four banks. Nothing you change there is saved."],
                ["Can I delete my data?", "Yes. Remove a bank and its transactions at any time, or delete your whole account from the Bank accounts page."],
              ].map(([q, a]) => (
                <details key={q} className="group rounded-[16px] bg-cloud px-6 py-5 transition-colors open:bg-brand-wash [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold text-ink">
                    {q}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-raised transition-transform duration-300 group-open:rotate-180">
                      <ChevronDown className="size-4" />
                    </span>
                  </summary>
                  <p className="pt-3 pr-10 text-[16px] leading-relaxed text-ink-soft">{a}</p>
                </details>
              ))}
            </div>
          </Wrap>
        </section>

        {/* Closing: lime band in both themes */}
        <section className="relative overflow-hidden bg-lime py-20 text-center text-forest sm:py-28">
          <CoinsArt className="pointer-events-none absolute -bottom-4 left-4 hidden h-40 w-auto md:block" />
          <CoinsArt className="pointer-events-none absolute top-6 right-6 hidden h-32 w-auto -scale-x-100 md:block" />
          <Wrap className="relative">
            <h2 className="mx-auto max-w-5xl text-[clamp(3rem,10vw,8rem)] leading-[0.84] font-black tracking-[-0.055em]" data-reveal>
              STOP GUESSING.
              <br />
              START COUNTING.
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-[19px] font-medium text-forest/80" data-reveal style={delay(100)}>
              Bring in one statement and see your real number in minutes.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-9" data-reveal style={delay(180)}>
              <Cta href={primary.href} inverse>
                {primary.label}
              </Cta>
              {!signedIn && canSignUp && (
                <Link href={demoHref} className="text-[16px] font-semibold text-forest underline decoration-2 underline-offset-[7px]">
                  Explore the demo
                </Link>
              )}
            </div>
          </Wrap>
        </section>
      </main>

      <footer className="bg-forest-deep text-white">
        <Wrap className="py-16">
          <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <LogoMark />
                <span className="text-[21px] font-black tracking-[-0.045em]">spendify</span>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-forest-soft">
                Every bank in one place: what you really received, where it went, and what you kept.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-[15px]">
              <p className="font-bold text-lime">Product</p>
              <p className="font-bold text-lime">Account</p>
              <a href="#try" className="text-forest-soft transition-colors hover:text-white">How it works</a>
              {canSignUp ? <Link href="/login" className="text-forest-soft transition-colors hover:text-white">Log in</Link> : <span />}
              <a href="#features" className="text-forest-soft transition-colors hover:text-white">Features</a>
              {canSignUp ? <Link href="/login?mode=signup" className="text-forest-soft transition-colors hover:text-white">Sign up</Link> : <span />}
              <a href="#security" className="text-forest-soft transition-colors hover:text-white">Security</a>
              <Link href={demoHref} className="text-forest-soft transition-colors hover:text-white">Demo</Link>
            </div>
          </div>
          <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-[14px] text-forest-soft sm:flex-row sm:justify-between">
            <p>© {new Date().getFullYear()} Spendify</p>
            <p>Amounts in Nigerian naira · Made for Nigerian banking</p>
          </div>
        </Wrap>
      </footer>

      {!signedIn && <FloatingCta href={demoHref} />}
    </div>
  );
}

function Feature({
  badge,
  title,
  body,
  points,
  visual,
  reverse,
}: {
  badge: string;
  title: string;
  body: string;
  points: string[];
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="py-12 sm:py-16">
      <Wrap className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <div className={cn(reverse && "lg:order-2")} data-reveal>
          <Badge>{badge}</Badge>
          <h2 className="mt-5 text-[clamp(2rem,4.2vw,3.4rem)] leading-[0.94] font-black tracking-[-0.045em]">{title}</h2>
          <p className="mt-6 text-[18px] leading-relaxed text-ink-soft">{body}</p>
          <ul className="mt-8 space-y-3.5">
            {points.map((p) => (
              <li key={p} className="flex gap-3 text-[16px] font-medium text-ink">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-lime">
                  <Check className="size-3 text-forest" strokeWidth={3.5} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className={cn("rounded-[28px] bg-brand-wash p-4 sm:p-10", reverse && "lg:order-1")} data-reveal="scale" style={delay(120)}>
          {visual}
        </div>
      </Wrap>
    </section>
  );
}

/** Headline card: True Inflow figure, bars that grow in, source split. */
function HeroCard({ stats, growth }: { stats: Stats; growth: number | null }) {
  const max = Math.max(...stats.monthly.map((m) => m.total), 1);
  const total = stats.total || 1;
  const other = stats.bySource.family + stats.bySource.returns + stats.bySource.other;
  return (
    <div className="animate-float rounded-[28px] bg-raised p-6 text-left text-ink shadow-float [animation-duration:9s] sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <Badge>True Inflow</Badge>
        <span className="rounded-full bg-cloud px-3 py-1 text-[13px] font-medium text-ink-soft">Last 12 months</span>
      </div>
      <p className="mt-6 text-[15px] text-ink-soft">You actually received</p>
      <CountUp
        value={stats.total}
        duration={1600}
        className="mt-1 block text-[clamp(2.3rem,6vw,4rem)] leading-none font-black tracking-[-0.05em] tabular-nums"
      />
      {growth !== null && (
        <p className="mt-4 flex items-center gap-2 text-[14px] text-ink-soft">
          <span className="inline-flex h-7 items-center gap-1 rounded-full bg-gain-wash px-2.5 font-semibold text-gain">
            ▲ {formatPercent(growth)}
          </span>
          vs the 12 months before
        </p>
      )}
      <div className="mt-8 flex h-40 items-end gap-1.5 border-b border-hairline sm:gap-2.5" data-reveal="fade">
        {stats.monthly.map((m, i) => (
          <div key={m.label} className="flex h-full flex-1 flex-col justify-end">
            <div
              className={cn("grow-y rounded-t-[6px]", i === stats.monthly.length - 1 ? "bg-brand" : "bg-brand/25")}
              style={{ height: `${Math.max((m.total / max) * 100, 3)}%`, "--i": i } as React.CSSProperties}
              title={`${m.label}: ${formatNaira(m.total)}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12px] font-medium text-ink-faint">
        <span>{stats.monthly[0]?.label}</span>
        <span>{stats.monthly[stats.monthly.length - 1]?.label}</span>
      </div>
      <div className="mt-6 flex h-2.5 w-full gap-[3px] overflow-hidden rounded-full">
        <div className="h-full rounded-l-full bg-brand" style={{ flexGrow: stats.bySource.salary }} />
        <div className="h-full bg-lime dark:bg-forest-soft" style={{ flexGrow: stats.bySource.business }} />
        <div className="h-full rounded-r-full bg-context" style={{ flexGrow: other }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-medium text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand" />
          Salary {formatPercent(stats.bySource.salary / total)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-lime ring-1 ring-forest/20 dark:bg-forest-soft" />
          Business {formatPercent(stats.bySource.business / total)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-context" />
          Other {formatPercent(other / total)}
        </span>
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
    <div className="rounded-[28px] border border-white/10 bg-forest-deep p-6 text-left sm:p-7" data-reveal style={delay(200)}>
      <p className="text-[12px] font-semibold tracking-[0.08em] text-lime uppercase">How we got there</p>
      <div className="mt-5 space-y-3 text-[15px]">
        <div className="flex justify-between gap-4">
          <span>Everything credited</span>
          <span className="font-semibold tabular-nums">{formatNairaCompact(stats.gross)}</span>
        </div>
        {rows.map(([label, amount]) => (
          <div key={label} className="flex justify-between gap-4 text-forest-soft">
            <span>{label}</span>
            <span className="shrink-0 whitespace-nowrap text-white tabular-nums">− {formatNairaCompact(amount)}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
        <span className="text-[14px] text-forest-soft">True Inflow</span>
        <span className="text-[30px] leading-none font-black tracking-[-0.04em] text-lime tabular-nums">{formatNairaCompact(stats.total)}</span>
      </div>
    </div>
  );
}

/** A coin travels from one bank to the other; Spendify recognises it and says so. */
function TransferCard({ example }: { example: NonNullable<Stats["example"]> }) {
  return (
    <div className="rounded-[28px] bg-raised p-5 text-ink shadow-float" data-reveal style={delay(320)}>
      <div className="flex items-center gap-3">
        <BankAvatar account={{ institution: example.from }} size={40} />
        <svg viewBox="0 0 160 24" className="h-6 flex-1" aria-hidden>
          <path id="transfer-path" d="M6 12 H154" stroke="var(--hairline)" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
          <circle r="7" fill="#9fe870" stroke="#163300" strokeWidth="2">
            <animateMotion dur="2.4s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.7;1" calcMode="spline" keySplines="0.4 0 0.2 1;0 0 1 1">
              <mpath href="#transfer-path" />
            </animateMotion>
          </circle>
        </svg>
        <BankAvatar account={{ institution: example.to }} size={40} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold">Transfer matched</p>
          <p className="truncate text-[13px] text-ink-faint">
            {example.from} → {example.to} · not counted as income
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-lime px-3 py-1 text-[14px] font-bold text-forest tabular-nums">
          {formatNairaCompact(example.amount)}
        </span>
      </div>
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
    <div className="rounded-[20px] bg-raised p-5 shadow-float sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[17px] font-bold">What we left out</p>
        <span className="rounded-full bg-cloud px-3 py-1 text-[13px] font-medium text-ink-soft">{stats.matchedTransfers} transfers</span>
      </div>
      <ul className="mt-4 divide-y divide-hairline">
        {rows.map((r, i) => (
          <li key={r.narration} className="flex items-center gap-3 py-3.5" data-reveal style={delay(250 + i * 110)}>
            <BankAvatar account={{ institution: r.bank }} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[12px] tracking-tight">{r.narration}</p>
              <p className="text-[13px] text-ink-faint">{r.note}</p>
            </div>
            <span
              className={cn(
                "hidden text-[14px] font-semibold tabular-nums sm:inline",
                !r.counted && "text-ink-faint line-through decoration-pebble"
              )}
            >
              {formatNairaCompact(r.amount)}
            </span>
            <span
              className={cn(
                "inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold",
                r.counted ? "bg-lime text-forest" : "border border-brand text-brand"
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
  const alert = ["Acct: 012****821", "Amt: NGN850,000.00 CR", "Desc: SALARY SEP 2026 BRIGHTWAVE", "Date: 25-Sep-2026 10:14"];
  const parsed = [
    ["25 Sep", "SALARY SEP 2026 BRIGHTWAVE", "+₦850,000", true],
    ["26 Sep", "BOLT RIDE LAGOS", "−₦3,500", false],
    ["26 Sep", "MTN DATA BUNDLE 25GB", "−₦12,000", false],
  ] as const;
  return (
    <div className="space-y-4">
      <div className="rounded-[20px] bg-raised p-5 font-mono text-[12.5px] leading-relaxed text-ink-soft shadow-float sm:p-6">
        <p className="mb-2 font-sans text-[13px] font-semibold text-ink-faint">Pasted alert</p>
        {alert.map((l, i) => (
          <p key={l} data-reveal="fade" style={delay(200 + i * 180)}>
            {l}
          </p>
        ))}
      </div>
      <div className="flex justify-center" data-reveal style={delay(950)}>
        <span className="flex size-11 items-center justify-center rounded-full bg-lime text-forest">
          <ArrowRight className="size-4 rotate-90" />
        </span>
      </div>
      <div className="rounded-[20px] bg-raised p-5 shadow-float sm:p-6">
        <div className="flex items-center justify-between text-[13px] font-medium text-ink-faint">
          <span>Ready to import</span>
          <span className="inline-flex items-center gap-1 text-gain">
            <ShieldCheck className="size-4" /> No duplicates
          </span>
        </div>
        {parsed.map(([d, n, a, credit], i) => (
          <div
            key={n}
            className="mt-3 flex items-center gap-3 border-t border-hairline pt-3 first-of-type:border-t-0"
            data-reveal
            style={delay(1100 + i * 140)}
          >
            <span className="w-14 shrink-0 text-[13px] text-ink-faint">{d}</span>
            <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{n}</span>
            <span className={cn("text-[14px] font-bold tabular-nums", credit ? "text-gain" : "text-ink")}>{a}</span>
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
  const pace = 0.77;
  return (
    <div className="rounded-[20px] bg-raised p-5 shadow-float sm:p-6" data-reveal="fade">
      <div className="flex items-baseline justify-between">
        <p className="text-[17px] font-bold">September budgets</p>
        <p className="text-[13px] font-medium text-ink-faint">Day 23 of 30</p>
      </div>
      <ul className="mt-6 space-y-6">
        {rows.map((r, i) => {
          const ratio = r.spent / r.limit;
          return (
            <li key={r.name}>
              <div className="flex items-baseline justify-between text-[14px]">
                <span className="font-semibold">{r.name}</span>
                <span className="text-ink-faint tabular-nums">
                  {formatNairaCompact(r.spent)} of {formatNairaCompact(r.limit)}
                </span>
              </div>
              <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-sunken">
                <div
                  className={cn("grow-x h-full rounded-full", ratio > pace + 0.1 ? "bg-warn" : "bg-brand")}
                  style={{ width: `${ratio * 100}%`, "--i": i } as React.CSSProperties}
                />
                <div className="absolute inset-y-0 w-0.5 bg-ink/40" style={{ left: `${pace * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 rounded-[14px] bg-cloud px-4 py-3 text-[13px] text-ink-soft">
        ₦340k moved to Kuda and ₦45k saved to PiggyVest this month. Neither counts as spending.
      </p>
    </div>
  );
}
