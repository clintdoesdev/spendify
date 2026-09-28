import type { Metadata } from "next";

import { OverviewView } from "@/components/overview/OverviewView";
import { getWorkspace } from "@/lib/data/workspace";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  return <OverviewView workspace={await getWorkspace()} />;
}
