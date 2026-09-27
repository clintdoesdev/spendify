import type { Metadata } from "next";

import { ImportView } from "@/components/import/ImportView";
import { getWorkspace } from "@/lib/data/workspace";

export const metadata: Metadata = { title: "Import" };

export default async function ImportPage() {
  return <ImportView workspace={await getWorkspace()} />;
}
