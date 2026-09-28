import type { Metadata } from "next";
import Link from "next/link";

import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser } from "@/lib/auth/session";
import { isLiveMode } from "@/lib/env";

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cloud px-4 py-16">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-[11px] bg-violet text-[18px] font-bold text-white">S</span>
        <span className="text-[22px] font-bold tracking-[-0.01em]">spendify</span>
      </Link>
      <div className="mt-8 w-full max-w-[420px] rounded-[28px] bg-white p-8 sm:rounded-[36px] sm:p-10">
        <h1 className="text-[28px] leading-tight font-bold tracking-[-0.02em]">Welcome</h1>
        <p className="mt-2 mb-8 text-[15px] text-ink-soft">See what you really received and spent, across every bank.</p>
        {isLiveMode() ? (
          <AuthForm next={safeNext} initialMode={mode === "signup" ? "signup" : "signin"} />
        ) : (
          <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-ink-soft">
              Spendify is running in <span className="font-semibold text-ink">demo mode</span>, so there&apos;s no login. Set{" "}
              <span className="font-mono text-[13px]">DATABASE_URL</span> (see <span className="font-mono text-[13px]">.env.example</span>) to turn on
              accounts.
            </p>
            <Link href="/overview" className="inline-flex h-12 w-full items-center justify-center rounded-full bg-violet text-[16px] font-medium text-white">
              Explore the demo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
