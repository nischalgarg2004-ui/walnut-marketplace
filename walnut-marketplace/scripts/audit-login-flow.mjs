/**
 * Independent login audit: POST /api/auth/login then GET role routes with Cookie.
 * Run: node scripts/audit-login-flow.mjs
 * Requires app + DB (GET /api/health db=up).
 */
const base = process.env.AUDIT_BASE_URL || "http://localhost:3000";
const PASS = process.env.AUDIT_PASSWORD || "WalnutDemo2026!";

const accounts = {
  creator: "priya.sharma@walnut.demo",
  business: "brand.glowskin@walnut.demo",
  admin: "admin@walnut.demo"
};

function cookieHeaderFromResponse(res) {
  const list =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  if (list.length) {
    return list.map((c) => c.split(";")[0].trim()).join("; ");
  }
  const single = res.headers.get("set-cookie");
  if (!single) return "";
  return single
    .split(/,(?=[^;]+?=)/)
    .map((p) => p.split(";")[0].trim())
    .join("; ");
}

async function login(email) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASS }),
    redirect: "manual"
  });
  const cookie = cookieHeaderFromResponse(res);
  const loc = res.headers.get("location") || "";

  if (res.status === 303 || res.status === 302 || res.status === 307) {
    const role = loc.includes("/admin")
      ? "ADMIN"
      : loc.includes("/business")
        ? "BUSINESS"
        : loc.includes("/creator")
          ? "CREATOR"
          : null;
    return {
      res,
      cookie,
      body: { data: role ? { role } : {} }
    };
  }

  const body = await res.json().catch(() => ({}));
  return { res, cookie, body };
}

async function get(path, cookie, redirect = "manual") {
  return fetch(`${base}${path}`, {
    redirect,
    headers: cookie ? { Cookie: cookie } : {}
  });
}

function reportLine(label, ok, detail) {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${label}${detail ? `: ${detail}` : ""}`);
}

async function main() {
  const health = await fetch(`${base}/api/health`).then((r) => r.json()).catch(() => null);
  if (!health || health.db !== "up") {
    console.error("Health check failed or db not up. Start Postgres + `npm run dev`.", health);
    process.exit(1);
  }

  const results = [];

  // --- Login as each role: expect 200 + session cookie
  for (const [role, email] of Object.entries(accounts)) {
    const { res, cookie, body } = await login(email);
    const ok =
      (res.status === 303 || res.status === 302 || res.status === 307) &&
      cookie.includes("walnut_session") &&
      body?.data?.role;
    results.push(ok);
    reportLine(`Login ${role} (${email})`, ok, `role=${body?.data?.role} cookie=${Boolean(cookie)}`);
    if (!ok) continue;

    // Home for that role should be 200
    const home =
      role === "creator" ? "/creator" : role === "business" ? "/business" : "/admin";
    const rHome = await get(home, cookie);
    const homeOk = rHome.status === 200;
    results.push(homeOk);
    reportLine(`GET ${home} as ${role}`, homeOk, `status=${rHome.status}`);

    // Nested page under same role
    const nested =
      role === "creator"
        ? "/creator/requirements"
        : role === "business"
          ? "/business/requirements"
          : "/admin/operations";
    const rNest = await get(nested, cookie);
    const nestOk = rNest.status === 200;
    results.push(nestOk);
    reportLine(`GET ${nested} as ${role}`, nestOk, `status=${rNest.status}`);
  }

  // --- Cross-role: wrong shell redirects to correct home (Next redirect = 307/308)
  const creatorLogin = await login(accounts.creator);
  const bizLogin = await login(accounts.business);
  const adminLogin = await login(accounts.admin);

  if (creatorLogin.cookie) {
    const r = await get("/business", creatorLogin.cookie);
    const ok = r.status === 307 || r.status === 308 || r.status === 302;
    const loc = r.headers.get("location") || "";
    const expectLoc = loc.includes("/creator");
    results.push(ok && expectLoc);
    reportLine("Creator session → GET /business redirects to /creator", ok && expectLoc, `status=${r.status} Location=${loc}`);

    const ra = await get("/admin", creatorLogin.cookie);
    const loca = ra.headers.get("location") || "";
    const oka =
      (ra.status === 307 || ra.status === 308 || ra.status === 302) && loca.includes("/creator");
    results.push(oka);
    reportLine("Creator session → GET /admin redirects to /creator", oka, `status=${ra.status} Location=${loca}`);
  }

  if (bizLogin.cookie) {
    const r = await get("/creator", bizLogin.cookie);
    const loc = r.headers.get("location") || "";
    const ok = (r.status === 307 || r.status === 308 || r.status === 302) && loc.includes("/business");
    results.push(ok);
    reportLine("Business session → GET /creator redirects to /business", ok, `status=${r.status} Location=${loc}`);

    const ra = await get("/admin", bizLogin.cookie);
    const loca = ra.headers.get("location") || "";
    const oka =
      (ra.status === 307 || ra.status === 308 || ra.status === 302) && loca.includes("/business");
    results.push(oka);
    reportLine("Business session → GET /admin redirects to /business", oka, `status=${ra.status} Location=${loca}`);
  }

  if (adminLogin.cookie) {
    const r = await get("/creator", adminLogin.cookie);
    const loc = r.headers.get("location") || "";
    const ok = (r.status === 307 || r.status === 308 || r.status === 302) && loc.includes("/admin");
    results.push(ok);
    reportLine("Admin session → GET /creator redirects to /admin", ok, `status=${r.status} Location=${loc}`);
  }

  // --- No cookie: middleware redirects to login
  const rNo = await get("/creator", "", "manual");
  const noOk =
    rNo.status === 307 || rNo.status === 308 || rNo.status === 302
      ? (rNo.headers.get("location") || "").includes("/login")
      : false;
  results.push(noOk);
  reportLine("No cookie → GET /creator redirects to /login", noOk, `status=${rNo.status} Location=${rNo.headers.get("location")}`);

  const failed = results.filter((x) => !x).length;
  console.log(failed ? `\nAudit finished: ${failed} check(s) failed.` : "\nAudit finished: all checks passed.");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
