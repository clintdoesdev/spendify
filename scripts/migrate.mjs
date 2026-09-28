// Applies pending SQL migrations from ./drizzle. Safe to run on every start: already-applied
// migrations are skipped. Uses only runtime dependencies, so it works in production images.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: use the real environment (Railway injects DATABASE_URL).
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL not set: demo mode, skipping migrations.");
  process.exit(0);
}

const client = postgres(url, { max: 1, onnotice: () => {} });
try {
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  console.log("Database migrations are up to date.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
