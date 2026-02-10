import { expect, test, type Page } from "@playwright/test";

const getMarkerCounts = async (page: Page) => {
  const stats = page.locator('[data-test-id="map-marker-counts"]');
  await expect(stats).toBeAttached();

  const total = Number(await stats.getAttribute("data-total-markers"));
  const visible = Number(await stats.getAttribute("data-visible-markers"));
  const closed = Number(await stats.getAttribute("data-closed-markers"));

  return { total, visible, closed };
};

const getRenderedMarkerCount = async (page: Page) => {
  const markers = page.locator("#map .leaflet-marker-icon");
  await expect.poll(async () => markers.count()).toBeGreaterThan(0);
  return markers.count();
};

const waitForMapTiles = async (page: Page) => {
  const tiles = page.locator("#map .leaflet-tile-container img");
  await expect.poll(async () => tiles.count()).toBeGreaterThan(0);
};

test.describe("maps page", () => {
  test("map renders and markers match expected subset", async ({ page }) => {
    await page.goto("/maps");

    await expect(page.getByText(/Also show places that have closed down\?/i)).toBeVisible();
    await waitForMapTiles(page);

    const initialCounts = await getMarkerCounts(page);
    const initialRendered = await getRenderedMarkerCount(page);
    expect(initialRendered).toBe(initialCounts.visible);

    if (initialCounts.closed > 0) {
      await page.getByRole("checkbox", { name: /Show closed places/i }).check();
      const toggledCounts = await getMarkerCounts(page);
      const toggledRendered = await getRenderedMarkerCount(page);
      expect(toggledCounts.visible).toBe(toggledCounts.total);
      expect(toggledRendered).toBe(toggledCounts.visible);
      expect(toggledCounts.visible).toBeGreaterThanOrEqual(initialCounts.visible);
    }
  });

  test("clicking a marker shows location info and link navigates", async ({ page }) => {
    await page.goto("/maps");
    await waitForMapTiles(page);

    const marker = page.locator("#map .leaflet-marker-icon").first();
    await marker.scrollIntoViewIfNeeded();
    await marker.click({ force: true });

    const popup = page.locator(".leaflet-popup-content");
    await expect(popup).toBeVisible();
    await expect(popup).toContainText(/\/10/);

    const popupLink = popup.locator("a").first();
    const href = await popupLink.getAttribute("href");
    expect(href).toBeTruthy();

    await popupLink.click();
    const expectedUrl = new RegExp(`${href?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\/?$`);
    await expect(page).toHaveURL(expectedUrl);
    await expect(page.locator("section.post-title h2")).toBeVisible();
  });

  test("minimum rating filter narrows visible markers", async ({ page }) => {
    await page.goto("/maps");
    await waitForMapTiles(page);

    const initialCounts = await getMarkerCounts(page);
    const initialRendered = await getRenderedMarkerCount(page);
    expect(initialRendered).toBe(initialCounts.visible);

    const minRatingInput = page.getByLabel(/Minimum rating/i);
    await expect(minRatingInput).toBeVisible();

    await minRatingInput.evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = "9.5";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect.poll(async () => (await getMarkerCounts(page)).visible).toBeLessThanOrEqual(
      initialCounts.visible
    );

    const filteredCounts = await getMarkerCounts(page);
    const filteredRendered = await getRenderedMarkerCount(page);
    expect(filteredRendered).toBe(filteredCounts.visible);
  });
});
