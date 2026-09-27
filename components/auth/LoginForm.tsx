"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

import { Notice, PillButton, TextField } from "@/components/ui/kit";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(error ?? null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const redirect = new URL("/auth/callback", window.location.origin);
    redirect.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirect.toString() },
    });
    if (error) {
      setState("idle");
      setMessage(error.message);
    } else setState("sent");
  };

  if (state === "sent") {
    return (
      <div className="text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-violet-wash">
          <Mail className="size-5 text-violet" />
        </span>
        <p className="mt-5 text-[20px] font-bold tracking-[-0.01em]">Check your email</p>
        <p className="mt-2 text-[15px] text-ink-soft">
          We sent a sign-in link to <span className="font-semibold text-ink">{email}</span>. Open it on this device.
        </p>
        <button type="button" onClick={() => setState("idle")} className="mt-6 text-[15px] font-medium text-violet">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {message && <Notice tone="error">{message}</Notice>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <PillButton type="submit" className="h-12 w-full text-[16px]" disabled={state === "sending"}>
        {state === "sending" ? "Sending link…" : "Email me a sign-in link"}
      </PillButton>
      <p className="text-center text-[13px] text-ink-faint">No password. New here? The same link creates your account.</p>
    </form>
  );
}
