// Brings the database up to date with ./drizzle. Railway runs it before every deployment
// (preDeployCommand in railway.json) and `npm start` runs it again, so it must be safe to run
// any number of times, including at once from several replicas:
//
//   1. Waits for Postgres to accept connections (private networking can lag a fresh deploy).
//   2. Takes an advisory lock so only one runner migrates at a time.
//   3. Adopts a database whose tables already match the schema but have no migration history
//      (e.g. created with `drizzle-kit push`), instead of failing on "table already exists".
//   4. Applies pending migrations in one transaction.
//   5. Verifies every table and column in the latest snapshot exists, so a bad state fails the
//      deploy instead of surfacing as errors in the app.
//
// Uses only runtime dependencies, so it works in production images.
import { readdirSync, readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";

const FOLDER = "drizzle";
const LOCK_KEY = 727_104_551; // Arbitrary, fixed: "spendify migrations".
const WAIT_SECONDS = Number(process.env.MIGRATE_WAIT_SECONDS ?? 60);

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: use the real environment (Railway injects DATABASE_URL).
}

const url = process.env.DATABASE_URL;
if (!url) {
  if (process.env.RAILWAY_ENVIRONMENT_NAME) {
    console.warn(
      "[migrate] DATABASE_URL is not set, so the app runs in demo mode and nothing is saved.\n" +
        "[migrate] To use your Railway Postgres, add DATABASE_URL = ${{Postgres.DATABASE_URL}} to this service's variables."
    );
  } else {
    console.log("[migrate] DATABASE_URL not set: demo mode, skipping migrations.");
  }
  process.exit(0);
}

// Railway's private hostname only resolves inside Railway. From Vercel (or anywhere else) it
// can never work, so fail at once with the fix instead of retrying for a minute.
if (/\.railway\.internal\b/.test(url) && !process.env.RAILWAY_ENVIRONMENT_NAME) {
  console.error(
    "[migrate] FAILED: DATABASE_URL points at Railway's private network (*.railway.internal), which is only\n" +
      "[migrate] reachable from services running on Railway. Use the public URL instead: in Railway open\n" +
      "[migrate] Postgres → Variables, copy DATABASE_PUBLIC_URL, and set it as DATABASE_URL here."
  );
  process.exit(1);
}

const log = (msg) => console.log(`[migrate] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const migrations = readMigrationFiles({ migrationsFolder: FOLDER });
const expected = latestSnapshotTables();

// One connection, so the advisory lock and the migration share a session.
const sql = postgres(url, { max: 1, onnotice: () => {}, connect_timeout: 10 });

try {
  await waitForDatabase();
  await sql`select pg_advisory_lock(${LOCK_KEY})`;
  try {
    await adoptExistingSchema();
    const before = await appliedCount();
    await migrate(drizzle(sql), { migrationsFolder: FOLDER });
    const after = await appliedCount();
    await verifySchema();
    log(
      after > before
        ? `Applied ${after - before} migration(s). Database is at ${lastTag()}.`
        : `Database is up to date (${lastTag()}).`
    );
  } finally {
    await sql`select pg_advisory_unlock(${LOCK_KEY})`.catch(() => {});
  }
} catch (error) {
  console.error(`[migrate] FAILED: ${error?.message ?? error}`);
  if (error?.detail) console.error(`[migrate] ${error.detail}`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}

async function waitForDatabase() {
  const deadline = Date.now() + WAIT_SECONDS * 1000;
  for (let attempt = 1; ; attempt++) {
    try {
      await sql`select 1`;
      return;
    } catch (error) {
      if (Date.now() > deadline) {
        throw new Error(`Postgres not reachable after ${WAIT_SECONDS}s: ${error.message}`);
      }
      const wait = Math.min(1000 * 2 ** (attempt - 1), 8000);
      log(`Waiting for Postgres (${error.code ?? error.message}), retrying in ${wait / 1000}s…`);
      await sleep(wait);
    }
  }
}

async function appliedCount() {
  const [{ exists }] = await sql`select to_regclass('drizzle.__drizzle_migrations') is not null as exists`;
  if (!exists) return 0;
  const [{ n }] = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
  return n;
}

/** Tables that exist in `public`, with their columns. */
async function currentTables() {
  const rows = await sql`
    select table_name, column_name from information_schema.columns where table_schema = 'public'`;
  const tables = new Map();
  for (const { table_name, column_name } of rows) {
    if (!tables.has(table_name)) tables.set(table_name, new Set());
    tables.get(table_name).add(column_name);
  }
  return tables;
}

function missingFrom(tables) {
  const missing = [];
  for (const [table, columns] of expected) {
    const have = tables.get(table);
    if (!have) missing.push(table);
    else for (const c of columns) if (!have.has(c)) missing.push(`${table}.${c}`);
  }
  return missing;
}

/**
 * A database with the full schema but no migration history would otherwise fail on
 * "relation already exists". Record the migrations as applied instead. A partial schema is
 * left alone: guessing there could lose data, so the error says what is missing.
 */
async function adoptExistingSchema() {
  if ((await appliedCount()) > 0) return;
  const tables = await currentTables();
  const ours = [...expected.keys()].filter((t) => tables.has(t));
  if (ours.length === 0) return; // Fresh database: migrate normally.

  const missing = missingFrom(tables);
  if (missing.length > 0) {
    throw new Error(
      `The database already has some Spendify tables (${ours.join(", ")}) but no migration history, ` +
        `and is missing: ${missing.join(", ")}. Point DATABASE_URL at an empty database, or drop ` +
        `these tables if they hold nothing you need, then redeploy.`
    );
  }
  log("Found the full schema without migration history: recording migrations as applied.");
  await sql`create schema if not exists drizzle`;
  await sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`;
  for (const m of migrations) {
    await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${m.hash}, ${m.folderMillis})`;
  }
}

async function verifySchema() {
  const missing = missingFrom(await currentTables());
  if (missing.length > 0) {
    throw new Error(`Migrations ran but the schema is incomplete. Missing: ${missing.join(", ")}`);
  }
}

function latestSnapshotTables() {
  const snapshots = readdirSync(`${FOLDER}/meta`).filter((f) => f.endsWith("_snapshot.json")).sort();
  const snapshot = JSON.parse(readFileSync(`${FOLDER}/meta/${snapshots.at(-1)}`, "utf8"));
  const tables = new Map();
  for (const t of Object.values(snapshot.tables)) {
    if (t.schema && t.schema !== "public") continue;
    tables.set(t.name, Object.keys(t.columns));
  }
  return tables;
}

function lastTag() {
  const journal = JSON.parse(readFileSync(`${FOLDER}/meta/_journal.json`, "utf8"));
  return journal.entries.at(-1).tag;
}
