import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, lt, sql } from "drizzle-orm";

import type { Db } from "@/lib/data/repo";
import { sessions, users } from "@/lib/db/schema";

export const SESSION_DAYS = 30;

export type AuthUser = { id: string; email: string; name: string };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function findUserByEmail(db: Db, email: string) {
  const [row] = await db.select().from(users).where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`);
  return row ?? null;
}

/** Creates a user, or returns null when the email is already registered. */
export async function createUser(db: Db, input: { email: string; name: string; passwordHash: string }) {
  const rows = await db
    .insert(users)
    .values({ email: input.email.trim(), name: input.name.trim(), passwordHash: input.passwordHash })
    .onConflictDoNothing()
    .returning({ id: users.id });
  return rows[0]?.id ?? null;
}

export async function createSession(db: Db, userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId, expiresAt });
  // Tidy up this user's expired sessions while we're here.
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  return { token, expiresAt };
}

export async function findSessionUser(db: Db, token: string): Promise<AuthUser | null> {
  if (!token) return null;
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())));
  return row ?? null;
}

/** Deletes a user; every table they own cascades. */
export async function deleteUser(db: Db, userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}

export async function deleteSession(db: Db, token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}
