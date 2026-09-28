import type { Metadata } from "next";

import { Landing } from "@/components/landing/Landing";
import { getCurrentUser } from "@/lib/auth/session";
import { isLiveMode } from "@/lib/env";

export const metadata: Metadata = {
  title: { absolute: "Spendify · Every bank. One honest number." },
  description:
    "Import statements and alerts from every Nigerian bank and wallet you use. Spendify removes transfers between your own accounts and shows what you really received, spent and kept.",
};

// Header buttons depend on whether you're signed in and whether a database is connected.
export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const live = isLiveMode();
  const user = live ? await getCurrentUser() : null;
  const { deleted } = await searchParams;
  return <Landing canSignUp={live} signedIn={Boolean(user)} deleted={deleted === "1"} />;
}
