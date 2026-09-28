import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { getDb } from "@/lib/db/client";

import { createSession, deleteSession, findSessionUser } from "./store";

const COOKIE = "spendify_session";

/** The signed-in user for this request, or null. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? findSessionUser(getDb(), token) : null;
});

export async function startSession(userId: string) {
  const { token, expiresAt } = await createSession(getDb(), userId);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await deleteSession(getDb(), token);
  store.delete(COOKIE);
}
