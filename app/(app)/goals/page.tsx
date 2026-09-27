import type { Metadata } from "next";

import { GoalsView } from "@/components/goals/GoalsView";
import { getWorkspace } from "@/lib/data/workspace";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage() {
  return <GoalsView workspace={await getWorkspace()} />;
}
