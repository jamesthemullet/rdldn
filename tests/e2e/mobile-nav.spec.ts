import { expect, test } from "@playwright/test";

test.describe("mobile nav toggle", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hamburger button opens and closes the nav menu", async ({ page }) => {
    await page.goto("/");

    const toggle = page.locator("#nav-toggle");
    const menu = page.locator("#nav-menu");

    await expect(toggle).toBeVisible();
    await expect(menu).not.toBeVisible();

    await toggle.click();
    await expect(menu).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await toggle.click();
    await expect(menu).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("nav links are reachable after opening the menu", async ({ page }) => {
    await page.goto("/");

    await page.locator("#nav-toggle").click();

    const nav = page.locator("#nav-menu");
    await expect(nav.getByRole("link", { name: "League Of Roasts" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Search" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Archive" })).toBeVisible();
  });
});

test.describe("desktop nav", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("hamburger button is hidden and menu is always visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#nav-toggle")).toBeHidden();
    await expect(page.locator("#nav-menu")).toBeVisible();
  });
});
