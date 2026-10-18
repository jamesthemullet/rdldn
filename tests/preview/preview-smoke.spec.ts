import { expect, test } from "@playwright/test";

if (!process.env.PREVIEW_URL) {
  throw new Error("PREVIEW_URL must be set to the deployment URL to test");
}

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

test.beforeEach(async ({ page }) => {
  // Get past Vercel deployment protection by having Vercel set its bypass cookie on the browser
  // context. The cookie covers every preview-origin request, including service worker scripts
  // and worker fetches that page.route can't intercept. Sending the header on every request
  // instead (extraHTTPHeaders) forces CORS preflights on third-party scripts like Clerk, which
  // fail, and leaks the secret to those hosts.
  if (bypassSecret) {
    await page.request.get("/", {
      headers: {
        "x-vercel-protection-bypass": bypassSecret,
        "x-vercel-set-bypass-cookie": "true",
      },
    });
  }

  // Stop the newsletter popup opening over the page mid-test. Init scripts run in every
  // frame, and sandboxed third-party iframes (e.g. the Substack embed) throw on localStorage.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("newsletter-dismissed", String(Date.now()));
    } catch {
      // not the top-level document
    }
  });
});

test("home page renders without server or console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  // Console "Failed to load resource" messages don't include the URL, so check failed responses
  // by URL instead. Substack's newsletter embed 403s automated browsers from CI runners.
  const failedResponses: string[] = [];
  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("substack.com")) {
      failedResponses.push(`${res.status()} ${res.url()}`);
    }
  });

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1, name: "Roast Dinners in London" })).toBeAttached();
  await expect(page.getByRole("heading", { level: 2, name: "Latest Reviews:" })).toBeVisible();
  await expect(
    page.locator("section.home-list").first().locator("li.heading a").first()
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
  expect(
    consoleErrors.filter(
      (text) => !text.includes("substack.com") && !text.startsWith("Failed to load resource")
    )
  ).toEqual([]);
});

const HOMEPAGE_CARD_SECTIONS = [
  "Latest Reviews:",
  "Find Your Favourite Roast:",
  "Interactive:",
  "Roast By Location:",
  "A few of the best roasts:",
  "Features:",
  "Roastatistics:",
];

test("every homepage section renders cards with loaded images", async ({ page }) => {
  test.setTimeout(60_000);
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  for (const heading of HOMEPAGE_CARD_SECTIONS) {
    const section = page.locator("section.home-list", {
      has: page.getByRole("heading", { level: 2, name: heading, exact: true }),
    });
    await expect(section, `section "${heading}" should render`).toBeVisible();

    const cards = section.locator("li.heading:not(.interactive-features__placeholder)");
    expect(await cards.count(), `section "${heading}" should have cards`).toBeGreaterThan(0);
    await expect(cards.first().locator("h3 a")).toHaveAttribute("href", /^\/.+/);

    const images = section.locator("li.heading img");
    for (let i = 0; i < (await images.count()); i++) {
      const img = images.nth(i);
      await img.scrollIntoViewIfNeeded();
      await expect(img, `image ${i + 1} in "${heading}" should load`).toHaveJSProperty("complete", true);
      // Broken or missing images swap to a local fallback via onerror, so allow for that swap
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth), {
          message: `image ${i + 1} in "${heading}" should have content`,
        })
        .toBeGreaterThan(0);
    }
  }
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
