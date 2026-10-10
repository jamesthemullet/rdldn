import { defineConfig, devices } from "@playwright/test";

// Runs a small suite with the real Clerk integration and middleware enabled.
// The main e2e config sets PLAYWRIGHT=true, which swaps Clerk out for a stub.
const port = 4322;

export default defineConfig({
  testDir: "./tests/clerk",
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
    headless: true,
  },
  webServer: {
    command: `yarn dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
