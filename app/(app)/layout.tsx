import { AppHeader } from "@/components/shell/AppHeader";
import { getWorkspace } from "@/lib/data/workspace";

// Decide demo vs live at request time, from the runtime DATABASE_URL, never at build time.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getWorkspace();
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader viewer={workspace.viewer} mode={workspace.mode} />
      <main className="flex-1 pb-20">{children}</main>
    </div>
  );
}
