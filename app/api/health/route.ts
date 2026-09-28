import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { isLiveMode } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Used by Railway's health check: the app is up and, in live mode, can reach Postgres. */
export async function GET() {
  if (!isLiveMode()) return Response.json({ ok: true, mode: "demo" });
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true, mode: "live" });
  } catch {
    return Response.json({ ok: false, mode: "live", error: "database unreachable" }, { status: 503 });
  }
}
