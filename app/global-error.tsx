"use client";

import "./globals.css";

/** Last-resort fallback when the root layout itself fails. Keeps the page on brand. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
        <h1 className="text-[clamp(2.4rem,7vw,4.5rem)] leading-[0.9] font-black tracking-[-0.05em] text-ink">
          SOMETHING SLIPPED.
        </h1>
        <p className="mt-5 max-w-md text-[17px] text-ink-soft">We couldn&apos;t load Spendify. Please try again.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 h-12 rounded-full bg-lime px-6 text-[16px] font-semibold text-forest"
        >
          Try again
        </button>
        {error.digest && <p className="mt-10 text-[13px] text-ink-faint">Reference: {error.digest}</p>}
      </body>
    </html>
  );
}
