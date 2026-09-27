import { OverviewView } from "@/components/overview/OverviewView";
import { getWorkspace } from "@/lib/data/workspace";

export default async function OverviewPage() {
  return <OverviewView workspace={await getWorkspace()} />;
}
