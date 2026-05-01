import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTokenExpiryDate,
  resolveInstagramMediaIdFromPermalink,
  shouldRefreshInstagramToken
} from "@/lib/integrations/instagram";

test("shouldRefreshInstagramToken returns true when expiry missing", () => {
  assert.equal(shouldRefreshInstagramToken(null), true);
});

test("shouldRefreshInstagramToken respects refresh window", () => {
  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const later = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  assert.equal(shouldRefreshInstagramToken(soon, 14), true);
  assert.equal(shouldRefreshInstagramToken(later, 14), false);
});

test("buildTokenExpiryDate computes future date", () => {
  const before = Date.now();
  const out = buildTokenExpiryDate(3600);
  const delta = out.getTime() - before;
  assert.ok(delta >= 3_590_000 && delta <= 3_610_000);
});

test("resolveInstagramMediaIdFromPermalink matches normalized permalink", async () => {
  const originalFetch = global.fetch;
  global.fetch = (async () =>
    ({
      ok: true,
      async json() {
        return {
          data: [{ id: "123", permalink: "https://www.instagram.com/reel/abc/?igsh=xyz" }]
        };
      }
    }) as Response) as typeof fetch;
  try {
    const mediaId = await resolveInstagramMediaIdFromPermalink({
      accessToken: "token",
      permalink: "https://www.instagram.com/reel/abc/"
    });
    assert.equal(mediaId, "123");
  } finally {
    global.fetch = originalFetch;
  }
});
