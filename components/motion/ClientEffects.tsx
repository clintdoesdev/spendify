"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { THEME_STORAGE_KEY } from "@/components/theme/themeScript";

/**
 * Site-wide behaviour that needs the browser: reveals `[data-reveal]` elements as they scroll
 * into view (including ones rendered later), and follows the OS theme when set to "system".
 */
export function ClientEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const show = (el: Element) => el.setAttribute("data-shown", "");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach(show);
      const mo = new MutationObserver(() => document.querySelectorAll("[data-reveal]:not([data-shown])").forEach(show));
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );
    const scan = () =>
      document.querySelectorAll("[data-reveal]:not([data-shown]):not([data-observed])").forEach((el) => {
        el.setAttribute("data-observed", "");
        io.observe(el);
      });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let choice = "system";
      try {
        choice = localStorage.getItem(THEME_STORAGE_KEY) || "system";
      } catch {}
      if (choice === "system") document.documentElement.dataset.theme = mq.matches ? "dark" : "light";
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return null;
}
