import { NextResponse, type NextRequest } from "next/server";

import { DEMO_COOKIE } from "@/lib/auth/session";

/** "Try the demo": explore the sample data without an account. Nothing is saved. */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/overview", request.url));
  response.cookies.set(DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
