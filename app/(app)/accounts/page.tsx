import type { Metadata } from "next";

import { AccountsView } from "@/components/accounts/AccountsView";
import { getWorkspace } from "@/lib/data/workspace";

export const metadata: Metadata = { title: "Bank accounts" };

export default async function AccountsPage() {
  return <AccountsView workspace={await getWorkspace()} />;
}
