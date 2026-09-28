/**
 * Spendify runs in two modes:
 * - live: DATABASE_URL set → email + password accounts, your own data in Postgres
 * - demo: DATABASE_URL missing → no login, sample statements, nothing is saved
 *
 * Server-only: DATABASE_URL is never exposed to the browser.
 */
export function isLiveMode() {
  return Boolean(process.env.DATABASE_URL);
}
