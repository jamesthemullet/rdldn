import { defineConfig, devices } from "@playwright/test";

// Runs smoke tests against a deployed build (e.g. a Vercel preview) rather than `astro dev`,
// so the production build, Vercel adapter and Clerk middleware are all exercised.

export default defineConfig({
  testDir: "./tests/preview",
  fullyParallel: true,
  retries: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PREVIEW_URL,
    trace: "on-first-retry",
    headless: true,
    // The Vercel protection bypass cookie is set in a beforeEach in tests/preview/preview-smoke.spec.ts
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
