import "@fontsource-variable/inter";
import type { Metadata, Viewport } from "next";

import { ClientEffects } from "@/components/motion/ClientEffects";
import { themeScript } from "@/components/theme/themeScript";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Spendify", template: "%s · Spendify" },
  description: "Every bank in one place: what you really received, where it went, and what you kept.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1008" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <ClientEffects />
      </body>
    </html>
  );
}
