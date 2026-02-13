import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "fallback",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "fallback",
});

export const metadata: Metadata = {
  title: "PyPilot | AI Python Learning SaaS",
  description: "Gamified AI-powered Python learning platform for students",
};

const themeBootScript = `
(() => {
  try {
    const key = "pypilot_theme_mode";
    const legacyKey = "pypilot_theme";
    const stored = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    const mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
    const root = document.documentElement;
    root.setAttribute("data-theme-mode", mode);
    root.setAttribute("data-theme", theme);
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");

    const chunkReloadKey = "pypilot_chunk_reload_ts";
    const maybeReloadForChunkError = (message) => {
      const text = String(message || "");
      const isChunkError =
        text.includes("ChunkLoadError") ||
        text.includes("Loading chunk") ||
        text.includes("CSS_CHUNK_LOAD_FAILED");
      if (!isChunkError) return;

      const now = Date.now();
      const last = Number(sessionStorage.getItem(chunkReloadKey) || "0");
      // Prevent reload loops; allow one auto-retry per 30 seconds.
      if (now - last > 30000) {
        sessionStorage.setItem(chunkReloadKey, String(now));
        window.location.reload();
      }
    };

    window.addEventListener("error", (event) => {
      maybeReloadForChunkError(event?.error?.message || event?.message);
    });
    window.addEventListener("unhandledrejection", (event) => {
      const reason = event?.reason;
      const message = typeof reason === "string" ? reason : reason?.message;
      maybeReloadForChunkError(message);
    });
  } catch {
    // Ignore init errors; theme toggle can recover client-side.
  }
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="font-display antialiased">{children}</body>
    </html>
  );
}
