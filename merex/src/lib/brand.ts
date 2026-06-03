/** Product branding — single source of truth for Merex rebrand. */

export const BRAND_NAME = "Merex";

/** Public support contact (keep on current domain until Merex email is live). */
export const SUPPORT_EMAIL = "hello@merex.in";

export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;

/** Session cookie — renamed to merex_session for completed branding migration. */
export const SESSION_COOKIE_NAME = "merex_session";

export const THEME_STORAGE_KEY = "merex_theme";

/** Legacy theme key — migrated once on read in theme-client. */
export const LEGACY_THEME_STORAGE_KEY = "ongram_theme";

/** Razorpay checkout merchant display name. */
export const PAYMENT_DISPLAY_NAME = "Merex";

/** Abstract round logos — still served from /brand/ongram until Merex-specific art exists. */
export const LOGO_ROUND_DARK = "/landing/tv-logo-white.png";
export const LOGO_ROUND_LIGHT = "/landing/tv-logo-black.png";

/** Canonical app origin for legal/Meta URLs (falls back to current production). */
export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return fromEnv || "https://www.merex.in";
}

export function appUrl(path: string): string {
  const base = getAppOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
