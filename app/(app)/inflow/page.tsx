import type { Metadata } from "next";

import { TrueInflowPage } from "@/components/true-inflow/TrueInflowPage";
import { getWorkspace } from "@/lib/data/workspace";

export const metadata: Metadata = {
  title: "True Inflow",
  description: "How much you actually received across all your banks, minus your own transfers.",
};

export default async function InflowPage() {
  return <TrueInflowPage workspace={await getWorkspace()} />;
}
