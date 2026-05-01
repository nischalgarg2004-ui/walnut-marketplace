import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { extractViewCountFromHtml, normalizeInstagramReelUrl } from "./instagram-reel-scrape";

test("normalizeInstagramReelUrl accepts reel paths", () => {
  assert.equal(normalizeInstagramReelUrl("https://www.instagram.com/reel/ABC123/"), "https://www.instagram.com/reel/ABC123/");
  assert.equal(
    normalizeInstagramReelUrl("instagram.com/reel/ABC123?utm_source=x"),
    "https://www.instagram.com/reel/ABC123/"
  );
  assert.equal(normalizeInstagramReelUrl("not a url"), null);
});

test("extractViewCountFromHtml reads fixture", () => {
  const html = readFileSync(join(process.cwd(), "src/lib/integrations/__fixtures__/reel-page-sample.html"), "utf8");
  const r = extractViewCountFromHtml(html);
  assert.ok(r);
  assert.equal(r.views, 48291);
});
