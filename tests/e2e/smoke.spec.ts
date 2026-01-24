import { expect, test } from "@playwright/test";

test("home page renders key hero elements without console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();

  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Roast Dinners in London" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Latest Reviews:" })).toBeVisible();

  const firstPostLink = page.locator("section.home-list").first().locator("li.heading a").first();
  await expect(firstPostLink).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("top navigation routes correctly and preserves history", async ({ page }) => {
  test.setTimeout(60_000);
  const assertUrl = async (expected: RegExp) => {
    await expect(page).toHaveURL(expected);
  };

  await page.goto("/");
  await assertUrl(/\/$/);

  const nav = page.locator("nav#nav-menu");

  const mainNavTargets = [
    {
      linkName: "League Of Roasts",
      url: /\/league-of-roasts\/?$/,
      verify: async () =>
        await expect(page.locator("section.post-title h2")).toHaveText(/League Of Roasts/i),
    },
    {
      linkName: "Archive",
      url: /\/archive\/?$/,
      verify: async () =>
        await expect(page.getByRole("heading", { level: 2, name: "Gravy Archives" })).toBeVisible(),
    },
    {
      linkName: "Search",
      url: /\/search\/?$/,
      verify: async () =>
        await expect(page.getByRole("heading", { level: 2, name: "Search" })).toBeVisible(),
    },
  ];

  const extraNavTargets = [
    {
      linkName: "Maps",
      url: /\/maps\/?$/,
      verify: async () =>
        await expect(page.getByText(/Also show places that have closed down\?/i)).toBeVisible(),
    },
    {
      linkName: "To-Do List",
      url: /\/to-do-list\/?$/,
      verify: async () =>
        await expect(page.locator("section.post-title h2")).toHaveText(/to-?do list/i),
    },
  ];

  for (const { linkName, url, verify } of mainNavTargets) {
    await nav.getByRole("link", { name: linkName }).click();
    await assertUrl(url);
    await verify();
  }

  const navigateHistory = async (action: () => Promise<unknown>, expected: RegExp, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await action();
        await assertUrl(expected);
        return;
      } catch (e) {
        if (attempt === retries) throw e;
        await page.waitForTimeout(500);
      }
    }
  };

  await navigateHistory(() => page.goBack({ waitUntil: "commit" }), /\/archive\/?$/);
  await navigateHistory(() => page.goBack({ waitUntil: "commit" }), /\/league-of-roasts\/?$/);

  await navigateHistory(() => page.goForward({ waitUntil: "commit" }), /\/archive\/?$/);
  await navigateHistory(() => page.goForward({ waitUntil: "commit" }), /\/search\/?$/);

  for (const { linkName, url, verify } of extraNavTargets) {
    await nav.getByRole("link", { name: linkName }).click();
    await assertUrl(url);
    await verify();
  }
});

test("league of roasts table renders, filters, and reveals extra data", async ({ page }) => {
  await page.goto("/league-of-roasts");
  await expect(page).toHaveURL(/\/league-of-roasts\/?$/);

  const sortPostsContainer = page.locator(".sort-posts-container");
  await expect(sortPostsContainer).toBeVisible({ timeout: 15000 });

  const leagueItems = page.locator("ol.league-of-roasts li.grid-item");
  const initialCount = await leagueItems.count();
  expect(initialCount).toBeGreaterThan(0);

  const firstItem = leagueItems.first();
  const firstLink = firstItem.locator("a");
  await expect(firstLink).toBeVisible();
  const firstHref = await firstLink.getAttribute("href");
  expect(firstHref).toBeTruthy();

  const ratingCell = firstItem.locator('[data-test-id="roast-rating"]');
  await expect(ratingCell).toBeVisible();
  await expect(ratingCell).not.toHaveText("");

  const closedColumn = firstItem.locator('[data-test-id="roast-status"]');
  await expect(closedColumn).toBeAttached();

  const closedItems = page.locator(".league-of-roasts a.closed-down");
  expect(await closedItems.count()).toBeGreaterThan(0);
  if ((await closedItems.count()) > 0) {
    const closedStatusText = await closedItems.first().evaluate((anchor) => {
      return (
        anchor.parentElement?.querySelector('[data-test-id="roast-status"]')?.textContent?.trim() ??
        ""
      );
    });
    expect(closedStatusText).not.toEqual("");
  }

  await firstLink.click();
  const escapedHref = firstHref!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await expect(page).toHaveURL(new RegExp(`${escapedHref}\\/?$`));
  await expect(page.locator("section.post-title h2")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/league-of-roasts\/?$/);
  await expect(leagueItems.first()).toBeVisible();

  const optionsButton = page.locator(".show-hide-button");
  const buttonLabel = (await optionsButton.textContent()) || "";
  if (buttonLabel.toLowerCase().includes("show")) {
    await optionsButton.click();
  }
  await expect(page.locator(".toggle-columns")).toBeVisible();

  await page.locator("#price").check();
  await page.locator("#meat").check();
  await expect(firstItem.locator('[data-test-id="roast-price"]')).toBeAttached();
  await expect(firstItem.locator('[data-test-id="roast-meat"]')).toBeAttached();

  const meatOptions = page.locator('#meat-filter option:not([value=""])');
  const selectedMeatValue = await meatOptions.first().getAttribute("value");
  expect(selectedMeatValue).toBeTruthy();
  const meatValue = selectedMeatValue as string;
  await page.locator("#meat-filter").selectOption(meatValue);

  await expect.poll(async () => {
    return page.evaluate((value) => {
      const rows = Array.from(document.querySelectorAll("ol.league-of-roasts li"));
      if (!rows.length) return false;
      return rows.every((row) => {
        const meatSpan = row.querySelector('[data-test-id="roast-meat"]');
        return !!meatSpan && meatSpan.textContent?.trim().toLowerCase() === value.toLowerCase();
      });
    }, meatValue);
  }).toBe(true);

  await page.locator("#score-filter").fill("200");
  await expect(leagueItems).toHaveCount(0);

  await page.getByRole("button", { name: /Clear All Filters/i }).click();
  await expect(leagueItems).toHaveCount(initialCount);
});
