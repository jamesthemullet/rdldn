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
