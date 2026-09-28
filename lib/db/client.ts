import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

export function createDb(url: string) {
  // prepare: false keeps it compatible with connection poolers such as PgBouncer. Short connect
  // and idle timeouts suit serverless hosts (Vercel), where instances freeze between requests.
  const client = postgres(url, { prepare: false, max: 5, connect_timeout: 10, idle_timeout: 20 });
  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as { spendifyDb?: Database };

/** One pooled client per server process (survives dev hot reloads). */
export function getDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — see .env.example."
    );
  }
  globalForDb.spendifyDb ??= createDb(url);
  return globalForDb.spendifyDb;
}
