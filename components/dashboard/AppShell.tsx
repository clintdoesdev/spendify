"use client";

import { usePathname } from "next/navigation";

import { MobileNav } from "@/components/dashboard/MobileNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="min-h-screen px-4 pt-6 pb-24 md:ml-60 md:p-8">
        <Topbar pathname={pathname} />
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
