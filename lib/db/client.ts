import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

export function createDb(url: string) {
  // prepare: false keeps it compatible with Supabase's transaction pooler (port 6543).
  const client = postgres(url, { prepare: false, max: 5 });
  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as { spendifyDb?: Database };

/** One pooled client per server process (survives dev hot reloads). */
export function getDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Live mode (Supabase variables present) needs it — see .env.example."
    );
  }
  globalForDb.spendifyDb ??= createDb(url);
  return globalForDb.spendifyDb;
}
