import { defineConfig, devices } from "@playwright/test";

// Runs smoke tests against a deployed build (e.g. a Vercel preview) rather than `astro dev`,
// so the production build, Vercel adapter and Clerk middleware are all exercised.
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "./tests/preview",
  fullyParallel: true,
  retries: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PREVIEW_URL,
    trace: "on-first-retry",
    headless: true,
    ...(bypassSecret && {
      extraHTTPHeaders: {
        "x-vercel-protection-bypass": bypassSecret,
        "x-vercel-set-bypass-cookie": "true",
      },
    }),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
