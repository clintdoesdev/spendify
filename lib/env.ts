/**
 * Spendify runs in two modes:
 * - live: Supabase variables set → login required, your own data in Postgres (DATABASE_URL)
 * - demo: Supabase variables missing → no login, sample statements, nothing is saved
 *
 * The NEXT_PUBLIC_ values are inlined at build time, so the mode is decided per build.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function isLiveMode() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
