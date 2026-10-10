import { expect, test } from "@playwright/test";

if (process.env.PLAYWRIGHT === "true") {
  throw new Error("PLAYWRIGHT=true disables Clerk; unset it to run the Clerk smoke tests");
}
if (!process.env.PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
  throw new Error("PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY must be set");
}

test.beforeEach(async ({ page }) => {
  // Stop the newsletter popup opening over the page mid-test
  await page.addInitScript(() => {
    localStorage.setItem("newsletter-dismissed", String(Date.now()));
  });
});

test("home page renders with Clerk middleware and shows sign in", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 2, name: "Latest Reviews:" })).toBeVisible();
  await expect(
    page.locator(".header-signin-desktop").getByRole("button", { name: /sign in/i })
  ).toBeVisible({ timeout: 15000 });

  expect(pageErrors).toEqual([]);
});

test("protected page redirects signed-out users to sign in", async ({ page }) => {
  await page.goto("/my-roasts");
  await expect(page).toHaveURL(/sign-in/);
});

test("protected API route does not serve signed-out users", async ({ request }) => {
  const response = await request.get("/api/wishlist", { maxRedirects: 0 });
  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
  expect(response.headers().location).toMatch(/sign-in/);
});
