"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { LogoMark } from "@/components/shell/AppHeader";

/** Shown when a page fails to render, e.g. the database is briefly unreachable. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-16 text-center">
      <Link href="/" aria-label="Spendify home" className="mb-10">
        <LogoMark />
      </Link>
      <h1 className="animate-rise text-[clamp(2.4rem,7vw,4.5rem)] leading-[0.9] font-black tracking-[-0.05em] text-ink">
        SOMETHING SLIPPED.
      </h1>
      <p className="mt-5 max-w-md text-[17px] text-ink-soft">
        We couldn&apos;t load this page. It&apos;s usually a brief connection problem, so trying again often works.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-lime px-6 text-[16px] font-semibold text-forest transition-colors hover:bg-lime-deep"
        >
          <RotateCcw className="size-4" /> Try again
        </button>
        <Link href="/" className="text-[16px] font-semibold text-brand underline underline-offset-4">
          Back to home
        </Link>
      </div>
      {error.digest && <p className="mt-10 text-[13px] text-ink-faint">Reference: {error.digest}</p>}
    </main>
  );
}
