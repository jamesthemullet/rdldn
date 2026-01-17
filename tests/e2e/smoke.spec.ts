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

  const navigateHistory = async (action: () => Promise<unknown>, expected: RegExp) => {
    await action();
    await assertUrl(expected);
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
