import { LEGACY_THEME_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/brand";

export type ThemePreference = "light" | "dark" | "system";

export { THEME_STORAGE_KEY };

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemePreference(theme: ThemePreference) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  root.classList.toggle("dark", resolved === "dark");
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  let value = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (!value) {
    const legacy = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (legacy === "light" || legacy === "dark" || legacy === "system") {
      window.localStorage.setItem(THEME_STORAGE_KEY, legacy);
      window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
      value = legacy;
    }
  }
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

export function setStoredThemePreference(theme: ThemePreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
