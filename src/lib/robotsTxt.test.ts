import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const robotsTxt = readFileSync(path.join(process.cwd(), "public", "robots.txt"), "utf-8");

describe("public/robots.txt", () => {
  it("disallows the real 404 route, not a non-existent .html path", () => {
    expect(robotsTxt).toContain("Disallow: /404");
    expect(robotsTxt).not.toContain("Disallow: /404.html");
  });
});
