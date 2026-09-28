"use client";

import { useActionState, useState } from "react";

import { signInAction, signUpAction, type AuthState } from "@/app/actions";
import { Notice, PillButton, Segmented, TextField } from "@/components/ui/kit";

export function AuthForm({ next, initialMode = "signin" }: { next: string; initialMode?: "signin" | "signup" }) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [signInState, signIn, signingIn] = useActionState<AuthState, FormData>(signInAction, undefined);
  const [signUpState, signUp, signingUp] = useActionState<AuthState, FormData>(signUpAction, undefined);
  const state = mode === "signin" ? signInState : signUpState;
  const pending = signingIn || signingUp;

  return (
    <div>
      <Segmented
        label="Sign in or create an account"
        value={mode}
        onChange={setMode}
        options={[
          { value: "signin", label: "Sign in" },
          { value: "signup", label: "Create account" },
        ]}
      />
      <form key={mode} action={mode === "signin" ? signIn : signUp} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        {state?.error && <Notice tone="error">{state.error}</Notice>}
        {mode === "signup" && (
          <TextField
            label="Your name"
            name="name"
            autoComplete="name"
            placeholder="Ada Obi"
            defaultValue={state?.name}
            hint="As it appears on your bank transfers. Helps us spot money you send yourself."
          />
        )}
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state?.email}
          required
          autoFocus
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 8 : undefined}
          hint={mode === "signup" ? "At least 8 characters." : undefined}
          required
        />
        <PillButton type="submit" className="h-12 w-full text-[16px]" disabled={pending}>
          {pending ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
        </PillButton>
      </form>
    </div>
  );
}
