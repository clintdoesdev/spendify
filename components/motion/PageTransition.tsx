"use client";

import { usePathname } from "next/navigation";

/** Re-mounts on navigation so each page rises in softly. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page">
      {children}
    </div>
  );
}
