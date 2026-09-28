import { sql } from "drizzle-orm";

import journal from "@/drizzle/meta/_journal.json";
import { getDb } from "@/lib/db/client";
import { isLiveMode } from "@/lib/env";

export const dynamic = "force-dynamic";

const latest = journal.entries.at(-1)!;

/**
 * Used by Railway's health check: the app is up and, in live mode, can reach Postgres and the
 * database has every migration this build ships. A deploy whose database is behind never goes live.
 */
export async function GET() {
  if (!isLiveMode()) return Response.json({ ok: true, mode: "demo" });

  let rows: Record<string, unknown>[];
  try {
    const result = await getDb().execute(
      sql`select coalesce(max(created_at), 0)::bigint as last from drizzle.__drizzle_migrations`
    );
    rows = [...result];
  } catch (error) {
    // Drizzle wraps the driver error; 42P01 is "table not found".
    const e = error as { code?: string; cause?: { code?: string } };
    const missing = (e.cause?.code ?? e.code) === "42P01";
    return Response.json(
      { ok: false, mode: "live", error: missing ? "database not migrated" : "database unreachable" },
      { status: 503 }
    );
  }

  const migrated = Number(rows[0]?.last ?? 0) >= latest.when;
  return Response.json(
    { ok: migrated, mode: "live", migration: latest.tag, ...(migrated ? {} : { error: "migrations pending" }) },
    { status: migrated ? 200 : 503 }
  );
}
