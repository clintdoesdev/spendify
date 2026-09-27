import type { Metadata } from "next";

import { TrueInflowPage } from "@/components/true-inflow/TrueInflowPage";

export const metadata: Metadata = {
  title: "True Inflow · spendify",
  description: "How much you actually received across all your banks, minus your own transfers.",
};

export default function InflowPage() {
  return <TrueInflowPage />;
}
