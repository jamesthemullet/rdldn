import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Reminder test: astro.config.mjs has a workaround (dropBeforeHydrationFromImageService)
// for a bug in @astrojs/vite-plugin-astro that breaks the image service build.
// This fails when that package is upgraded, so whoever bumps it re-checks the workaround.
const WORKAROUND_CHECKED_AGAINST = "0.1.1";

describe("astro.config.mjs workarounds", () => {
  it("before-hydration image service workaround has been re-checked for the installed @astrojs/vite-plugin-astro", () => {
    const pkgPath = path.join(
      process.cwd(),
      "node_modules",
      "@astrojs",
      "vite-plugin-astro",
      "package.json"
    );
    const { version } = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };

    expect(
      version,
      [
        `@astrojs/vite-plugin-astro is now ${version}.`,
        "Check whether it still emits astro:scripts/before-hydration.js in the astroImageService build",
        "(see dropBeforeHydrationFromImageService in astro.config.mjs).",
        "If fixed: delete the workaround and this test.",
        `If not: update WORKAROUND_CHECKED_AGAINST to ${version}.`
      ].join(" ")
    ).toBe(WORKAROUND_CHECKED_AGAINST);
  });
});
