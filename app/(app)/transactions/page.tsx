import type { Metadata } from "next";

import { TransactionsView } from "@/components/transactions/TransactionsView";
import { getWorkspace } from "@/lib/data/workspace";

export const metadata: Metadata = { title: "Transactions" };

export default async function TransactionsPage() {
  return <TransactionsView workspace={await getWorkspace()} />;
}
