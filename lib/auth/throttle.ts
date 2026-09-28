// Simple in-memory limit on failed sign-ins. Good enough for a single Railway instance;
// move to Postgres or Redis if you run more than one replica.
const WINDOW_MS = 15 * 60_000;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function isThrottled(key: string, limit: number) {
  const entry = attempts.get(key);
  return Boolean(entry && entry.resetAt > Date.now() && entry.count >= limit);
}

export function recordFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count++;
  if (attempts.size > 10_000) for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
}

export function clearFailures(key: string) {
  attempts.delete(key);
}
