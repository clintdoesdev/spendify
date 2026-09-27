import type { Metadata } from "next";

import { BudgetsView } from "@/components/budgets/BudgetsView";
import { getWorkspace } from "@/lib/data/workspace";

export const metadata: Metadata = { title: "Budgets" };

export default async function BudgetsPage() {
  return <BudgetsView workspace={await getWorkspace()} />;
}
