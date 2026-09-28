import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";

import { AuthForm } from "@/components/auth/AuthForm";
import { demoStats } from "@/components/landing/demoStats";
import { CountUp } from "@/components/motion/CountUp";
import { LogoMark } from "@/components/shell/AppHeader";
import { ThemeButton } from "@/components/theme/ThemeToggle";
import { getCurrentUser } from "@/lib/auth/session";
import { isLiveMode } from "@/lib/env";
import { formatNairaCompact } from "@/lib/money";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string }>;
}) {
  const { next, mode } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/overview";
  if (isLiveMode() && (await getCurrentUser())) redirect(safeNext);
  const stats = demoStats();

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Brand panel: forest in both themes */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-forest p-12 text-white lg:flex xl:p-16">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Spendify home">
          <LogoMark />
          <span className="text-[21px] font-black tracking-[-0.045em]">spendify</span>
        </Link>

        <div>
          <h2 className="animate-rise text-[clamp(3rem,5.4vw,5.6rem)] leading-[0.86] font-black tracking-[-0.05em] text-lime">
            YOUR REAL NUMBER IS WAITING.
          </h2>
          <div className="mt-12 max-w-md animate-rise rounded-[24px] bg-white/[0.06] p-6 ring-1 ring-white/10 [animation-delay:200ms]">
            <p className="text-[13px] font-semibold tracking-[0.08em] text-forest-soft uppercase">Sample True Inflow · 12 months</p>
            <CountUp value={stats.total} duration={1800} className="mt-3 block text-[44px] leading-none font-black tracking-[-0.045em] tabular-nums" />
            <p className="mt-3 text-[15px] text-forest-soft">
              out of {formatNairaCompact(stats.gross)} credited. The rest was money moving between the same person&apos;s accounts.
            </p>
          </div>
        </div>

        <ul className="space-y-3 text-[15px] text-forest-soft">
          {["We never ask for your internet banking login", "Passwords hashed, sessions encrypted", "Delete everything, any time"].map((t, i) => (
            <li key={t} className="flex animate-rise items-center gap-3" style={{ animationDelay: `${350 + i * 90}ms` }}>
              <span className="flex size-6 items-center justify-center rounded-full bg-lime">
                <Check className="size-3.5 text-forest" strokeWidth={3} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </aside>

      {/* Form */}
      <main className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 lg:invisible" aria-label="Spendify home">
            <LogoMark />
            <span className="text-[21px] font-black tracking-[-0.045em]">spendify</span>
          </Link>
          <ThemeButton />
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">
          <div className="animate-rise">
            {isLiveMode() ? (
              <AuthForm next={safeNext} initialMode={mode === "signup" ? "signup" : "signin"} />
            ) : (
              <div className="space-y-5 rounded-[24px] bg-cloud p-6">
                <h1 className="text-[44px] leading-[0.92] font-black tracking-[-0.045em] text-ink">Welcome.</h1>
                <p className="text-[15px] leading-relaxed text-ink-soft">
                  Spendify is running in <span className="font-semibold text-ink">demo mode</span>, so there&apos;s no login. Set{" "}
                  <span className="font-mono text-[13px]">DATABASE_URL</span> (see <span className="font-mono text-[13px]">.env.example</span>) to
                  turn on accounts.
                </p>
                <Link
                  href="/overview"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-lime text-[16px] font-semibold text-forest transition-colors hover:bg-lime-deep"
                >
                  Explore the demo
                </Link>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[13px] text-ink-faint">
          <Link href="/" className="underline decoration-lime decoration-2 underline-offset-4 hover:decoration-ink">
            Back to spendify
          </Link>
        </p>
      </main>
    </div>
  );
}
