import { expect, test } from "@playwright/test";

const showPopup = async (page: import("@playwright/test").Page) => {
  await page.evaluate(() => {
    const overlay = document.getElementById("newsletter-popup-overlay");
    if (overlay) {
      overlay.classList.add("visible");
      overlay.setAttribute("aria-hidden", "false");
    }
  });
};

test.describe("newsletter popup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("newsletter-dismissed"));
  });

  test("dismisses via close button and persists dismissal to localStorage", async ({ page }) => {
    await showPopup(page);

    const overlay = page.locator("#newsletter-popup-overlay");
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute("aria-hidden", "false");

    await page.locator("#newsletter-popup-close").click();

    await expect(overlay).not.toBeVisible();
    await expect(overlay).toHaveAttribute("aria-hidden", "true");

    const stored = await page.evaluate(() => localStorage.getItem("newsletter-dismissed"));
    expect(stored).not.toBeNull();
  });

  test("closes when clicking the overlay backdrop without saving to localStorage", async ({ page }) => {
    await showPopup(page);

    const overlay = page.locator("#newsletter-popup-overlay");
    await expect(overlay).toBeVisible();

    await overlay.click({ position: { x: 5, y: 5 } });

    await expect(overlay).not.toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem("newsletter-dismissed"));
    expect(stored).toBeNull();
  });

  test("closes on Escape key press without saving to localStorage", async ({ page }) => {
    await showPopup(page);

    const overlay = page.locator("#newsletter-popup-overlay");
    await expect(overlay).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(overlay).not.toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem("newsletter-dismissed"));
    expect(stored).toBeNull();
  });

  test("traps focus within the popup on Tab and Shift+Tab", async ({ page }) => {
    await showPopup(page);

    const closeBtn = page.locator("#newsletter-popup-close");
    await closeBtn.focus();
    await expect(closeBtn).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(closeBtn).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(closeBtn).toBeFocused();
  });
});
