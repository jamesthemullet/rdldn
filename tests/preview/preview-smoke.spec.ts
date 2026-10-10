import { expect, test } from "@playwright/test";

if (!process.env.PREVIEW_URL) {
  throw new Error("PREVIEW_URL must be set to the deployment URL to test");
}

test.beforeEach(async ({ page }) => {
  // Stop the newsletter popup opening over the page mid-test
  await page.addInitScript(() => {
    localStorage.setItem("newsletter-dismissed", String(Date.now()));
  });
});

test("home page renders without server or console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1, name: "Roast Dinners in London" })).toBeAttached();
  await expect(page.getByRole("heading", { level: 2, name: "Latest Reviews:" })).toBeVisible();
  await expect(
    page.locator("section.home-list").first().locator("li.heading a").first()
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter((text) => !text.includes("substack.com"))).toEqual([]);
});

test("a review page renders from the server", async ({ page }) => {
  await page.goto("/");
  const firstPostLink = page.locator("section.home-list").first().locator("li.heading a").first();
  const href = await firstPostLink.getAttribute("href");
  expect(href).toBeTruthy();

  const response = await page.goto(href as string);
  expect(response?.status()).toBe(200);
  await expect(page.locator("section.post-title h2")).toBeVisible();
});

test("prerendered page is served", async ({ page }) => {
  const response = await page.goto("/best-roast-potatoes-in-london");
  expect(response?.status()).toBe(200);
  await expect(page.locator("section.post-title h2")).toBeVisible();
});

test("league of roasts lists roasts", async ({ page }) => {
  const response = await page.goto("/league-of-roasts");
  expect(response?.status()).toBe(200);
  await expect(page.locator("ol.league-of-roasts li.grid-item").first()).toBeVisible({
    timeout: 15000,
  });
});

test("unknown routes render the custom 404 page", async ({ page }) => {
  const response = await page.goto(`/this-page-does-not-exist-${Date.now()}`);
  expect(response?.status()).toBe(404);
  await expect(page.locator("a.safety-link")).toBeVisible();
});

test("protected routes redirect signed-out users to sign in", async ({ page }) => {
  await page.goto("/my-roasts");
  await expect(page).toHaveURL(/sign-in/);
});
