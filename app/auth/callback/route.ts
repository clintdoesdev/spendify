import { NextResponse, type NextRequest } from "next/server";

import { isLiveMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Only allow redirects back into this app, never to another site. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  if (!isLiveMode()) return NextResponse.redirect(new URL("/", origin));

  const code = searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  const url = new URL("/login", origin);
  url.searchParams.set("error", "That sign-in link is invalid or has expired. Request a new one.");
  return NextResponse.redirect(url);
}
