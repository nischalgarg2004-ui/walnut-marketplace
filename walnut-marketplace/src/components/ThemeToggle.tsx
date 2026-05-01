"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyThemePreference,
  getStoredThemePreference,
  setStoredThemePreference,
  ThemePreference
} from "@/lib/theme-client";

const ORDER: ThemePreference[] = ["light", "dark", "system"];

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = getStoredThemePreference();
    setTheme(stored);
    applyThemePreference(stored);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onMedia = () => {
      if (getStoredThemePreference() === "system") {
        applyThemePreference("system");
      }
    };
    media.addEventListener("change", onMedia);
    return () => media.removeEventListener("change", onMedia);
  }, []);

  const label = useMemo(() => {
    if (theme === "light") return "Light";
    if (theme === "dark") return "Dark";
    return "System";
  }, [theme]);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    setStoredThemePreference(next);
    applyThemePreference(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${label}`}
      aria-label={`Theme: ${label}`}
      className={compact ? "inline-flex min-h-touch min-w-touch items-center justify-center rounded-md border border-white/10 px-2 text-sm hover:bg-white/10" : "btn ghost"}
    >
      {compact ? (theme === "light" ? "☀" : theme === "dark" ? "☾" : "◐") : `Theme: ${label}`}
    </button>
  );
}
