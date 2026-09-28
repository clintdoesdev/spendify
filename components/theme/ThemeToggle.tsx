"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

import { THEME_STORAGE_KEY } from "./themeScript";

export type ThemeChoice = "light" | "dark" | "system";

function resolve(choice: ThemeChoice) {
  if (choice !== "system") return choice;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(choice: ThemeChoice) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Private mode: the choice still applies for this page.
  }
  document.documentElement.dataset.theme = resolve(choice);
  window.dispatchEvent(new CustomEvent("spendify-theme", { detail: choice }));
}

export function useThemeChoice() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  useEffect(() => {
    const read = () => {
      let saved: ThemeChoice = "system";
      try {
        saved = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeChoice) || "system";
      } catch {}
      setChoice(saved);
      setResolved(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("spendify-theme", read);
    return () => {
      observer.disconnect();
      window.removeEventListener("spendify-theme", read);
    };
  }, []);
  return { choice, resolved };
}

/** Single round button: flips between light and dark, with the icons rolling past each other. */
export function ThemeButton({ className, onDark }: { className?: string; onDark?: boolean }) {
  const { resolved } = useThemeChoice();
  const dark = resolved === "dark";
  return (
    <button
      type="button"
      onClick={() => applyTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={cn(
        "relative flex size-10 items-center justify-center overflow-hidden rounded-full transition-colors",
        onDark ? "text-white hover:bg-white/10" : "text-ink hover:bg-cloud",
        className
      )}
    >
      <Sun
        className={cn("absolute size-[18px] transition-all duration-500", dark ? "translate-y-0 rotate-0 opacity-100" : "translate-y-6 -rotate-90 opacity-0")}
      />
      <Moon
        className={cn("absolute size-[18px] transition-all duration-500", dark ? "-translate-y-6 rotate-90 opacity-0" : "translate-y-0 rotate-0 opacity-100")}
      />
    </button>
  );
}

/** Light / Dark / System picker for menus and settings. */
export function ThemeSegmented() {
  const { choice } = useThemeChoice();
  const options: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "Auto", icon: Monitor },
  ];
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-full bg-cloud p-1">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={choice === value}
          onClick={() => applyTheme(value)}
          className={cn(
            "flex h-8 items-center justify-center gap-1.5 rounded-full text-[13px] transition-colors",
            choice === value ? "bg-raised text-ink shadow-lift" : "text-ink-faint hover:text-ink"
          )}
        >
          <Icon className="size-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}
