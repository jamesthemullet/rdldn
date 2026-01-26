import { expect, test, type Page } from "@playwright/test";

const POSTS = [
  {
    name: "Blacklock Shoreditch",
    path: "/blacklock-shoreditch/",
    expectsRelated: true,
  },
  {
    name: "The Fox & Pheasant Chelsea",
    path: "/the-fox-pheasant-chelsea/",
    expectsRelated: true,
  },
  {
    name: "The Ladbroke Arms Holland Park",
    path: "/the-ladbroke-arms-holland-park/",
    expectsRelated: true,
  },
  // {
  //   name: "Duke of Wellington Notting Hill",
  //   path: "/duke-wellington-notting-hill/",
  //   expectsRelated: true,
  // },
  {
    name: "The Islington Town House",
    path: "/the-islington-town-house/",
    expectsRelated: true,
  },
  {
    name: "The Harwood Arms Fulham",
    path: "/the-harwood-arms-fulham/",
    expectsRelated: true,
  },
  {
    name: "10 Best Roast Dinners in London 2025",
    path: "/10-best-roast-dinners-in-london-2025/",
    expectsRelated: false,
  },
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const scrollPageForLazyImages = async (page: Page) => {
  await page.evaluate(async () => {
    const step = 800;
    const delay = 50;
    const height = document.body.scrollHeight;
    let y = 0;

    while (y < height) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, delay));
      y += step;
    }

    window.scrollTo(0, 0);
  });
};

const collectBrokenImages = async (page: Page) => {
  await scrollPageForLazyImages(page);

  return page.evaluate(async () => {
    const images = Array.from(document.images);
    const results: { src: string; complete: boolean; width: number; height: number }[] = [];
    const loadTimeoutMs = 3000;

    for (const img of images) {
      if (!img.src) continue;

      if (!img.complete) {
        await Promise.race([
          new Promise((resolve) => {
            const done = () => resolve(undefined);
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }),
          new Promise((resolve) => setTimeout(resolve, loadTimeoutMs)),
        ]);
      }

      results.push({
        src: img.currentSrc || img.src,
        complete: img.complete,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }

    return results.filter((img) => !img.complete || img.width === 0 || img.height === 0);
  });
};

const ensureRelatedLinkWorks = async (page: Page) => {
  const relatedSection = page.locator("section.roast-by-tag, section.also-worth-a-try");
  await expect(relatedSection).toBeVisible();

  const relatedLink = relatedSection.locator("a[href^='/']").first();
  await expect(relatedLink).toBeVisible();

  const relatedHref = await relatedLink.getAttribute("href");
  expect(relatedHref).toBeTruthy();

  await relatedLink.click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(relatedHref as string)}\\/?$`));
  await expect(page.locator("section.post-title h2")).toBeVisible();
};

test.describe("post detail pages", () => {
  for (const post of POSTS) {
    test(`${post.name} renders body content, images, and related links`, async ({ page }) => {
      test.setTimeout(60_000);
      const failedImages: string[] = [];
      page.on("requestfailed", (request) => {
        if (request.resourceType() === "image") {
          failedImages.push(request.url());
        }
      });

      const response = await page.goto(post.path, { waitUntil: "networkidle" });
      expect(response?.ok()).toBeTruthy();

      await expect(page.locator("section.post-title h2")).toBeVisible();
      await expect(page.locator("div.container")).toBeVisible();

      const bodyText = (await page.locator("div.container").innerText()).trim();
      expect(bodyText.length).toBeGreaterThan(80);

      const brokenImages = await collectBrokenImages(page);
      expect(
        brokenImages,
        `Broken images: ${brokenImages.map((img) => img.src).join(", ")}`
      ).toEqual([]);
      expect(failedImages).toEqual([]);

      if (post.expectsRelated) {
        await ensureRelatedLinkWorks(page);
      } else {
        await expect(
          page.locator("section.roast-by-tag, section.also-worth-a-try")
        ).toHaveCount(0);
      }
    });
  }
});
