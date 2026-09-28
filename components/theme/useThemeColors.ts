"use client";

import { useEffect, useState } from "react";

const TOKENS = ["brand", "context", "ink", "ink-faint", "pebble", "hairline", "cloud", "raised", "gain", "loss"] as const;
type Token = (typeof TOKENS)[number];
export type ThemeColors = Record<Token, string>;

const FALLBACK: ThemeColors = {
  brand: "#163300",
  context: "#d3d9cd",
  ink: "#0e0f0c",
  "ink-faint": "#6a6c6a",
  pebble: "#868685",
  hairline: "#e1e5dd",
  cloud: "#f0f2ed",
  raised: "#ffffff",
  gain: "#1f7a2e",
  loss: "#b3242b",
};

function read(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(TOKENS.map((t) => [t, style.getPropertyValue(`--${t}`).trim() || FALLBACK[t]])) as ThemeColors;
}

/** Resolved token colours for SVG/canvas charts, updated when the theme changes. */
export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(FALLBACK);
  useEffect(() => {
    setColors(read());
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return colors;
}
