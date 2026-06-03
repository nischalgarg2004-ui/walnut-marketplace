/**
 * Optional dedicated admin hostname (e.g. admin.merex.in). Leave unset for path-based admin
 * on the main app (uses NEXT_PUBLIC_APP_URL, e.g. /admin) with sign-in at /login/admin.
 * When set: /admin on the main site redirects to this host and email login there is ADMIN-only.
 */
export function getConfiguredAdminHostname(): string | null {
  const h = process.env.NEXT_PUBLIC_ADMIN_HOST?.trim().toLowerCase();
  return h || null;
}

export function normalizeHostname(host: string | null | undefined): string {
  if (!host) return "";
  return host.split(":")[0].toLowerCase();
}

export function isAdminHostname(hostHeader: string | null | undefined): boolean {
  const configured = getConfiguredAdminHostname();
  if (!configured) return false;
  return normalizeHostname(hostHeader) === configured;
}

export function buildAbsoluteAdminPortalUrl(req: { headers: Headers; nextUrl: URL }, pathname: string, search: string) {
  const adminHost = getConfiguredAdminHostname();
  if (!adminHost) {
    throw new Error("NEXT_PUBLIC_ADMIN_HOST is not configured");
  }
  const proto =
    req.headers.get("x-forwarded-proto") ?? (req.nextUrl.protocol === "https:" ? "https" : "http");
  const port = req.nextUrl.port;
  const portSuffix =
    port && port !== "80" && port !== "443" && !adminHost.includes(":") ? `:${port}` : "";
  return `${proto}://${adminHost}${portSuffix}${pathname}${search}`;
}

/** Browser-only: origin for the admin portal (keeps current port for local dev). */
export function getAdminPortalOriginFromBrowser(): string | null {
  if (typeof window === "undefined") return null;
  const host = getConfiguredAdminHostname();
  if (!host) return null;
  const { protocol, port } = window.location;
  const portPart = port && port !== "80" && port !== "443" ? `:${port}` : "";
  return `${protocol}//${host}${portPart}`;
}

export function adminLoginPath(): "/login/admin" {
  return "/login/admin";
}
