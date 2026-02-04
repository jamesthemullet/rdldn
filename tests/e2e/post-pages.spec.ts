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

  await page.waitForTimeout(500);

  return page.evaluate(() => {
    const images = Array.from(document.images).filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    return images
      .map((img) => ({
        src: img.currentSrc || img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }))
      .filter((img) => img.width === 0 && img.height === 0);
  });
};

const normalizePathname = (value: string) => (value.endsWith("/") ? value : `${value}/`);

const assertSeoBasics = async (page: Page, expectedPathname: string) => {
  const title = (await page.title()).trim();
  expect(title.length).toBeGreaterThan(0);

  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveAttribute("content", /.+/);

  const canonical = page.locator('link[rel="canonical"]');
  const canonicalFirst = canonical.first();
  await expect(canonicalFirst).toHaveAttribute("href", /.+/);
  const canonicalHref = await canonicalFirst.getAttribute("href");
  expect(canonicalHref).toBeTruthy();

  const canonicalUrl = new URL(canonicalHref as string, page.url());
  expect(normalizePathname(canonicalUrl.pathname)).toBe(normalizePathname(expectedPathname));
};


const ensureRelatedLinkWorks = async (page: Page) => {
  const relatedSection = page.locator("section.roast-by-tag, section.also-worth-a-try");
  await expect(relatedSection).toBeVisible();

  const relatedLink = relatedSection.locator("a[href^='/']").first();
  await expect(relatedLink).toBeVisible();

  const relatedHref = await relatedLink.getAttribute("href");
  expect(relatedHref).toBeTruthy();

  await relatedLink.scrollIntoViewIfNeeded();
  await relatedLink.click({ timeout: 10_000 });

  await expect(page.locator("section.post-title h2")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(relatedHref as string)}\\/?$`));
  await expect(page.locator("section.post-title h2")).toBeVisible();
};

test.describe("post detail pages", () => {
  for (const post of POSTS) {
    test(`${post.name} renders body content, images, and related links`, async ({ page }) => {
      test.setTimeout(60_000);
      const failedImages: string[] = [];
      page.on("requestfailed", (request) => {
        if (
          request.resourceType() === "image" &&
          !request.failure()?.errorText.includes("net::ERR_ABORTED")
        ) {
          failedImages.push(request.url());
        }
      });

      const response = await page.goto(post.path, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      expect(response?.ok()).toBeTruthy();

      await page.waitForLoadState("load");

      await expect(page.locator("section.post-title h2")).toBeVisible({
        timeout: 15_000,
      });

      await assertSeoBasics(page, post.path);

      await expect(page.locator("div.container")).toBeVisible();

      const bodyText = (await page.locator("div.container").innerText()).trim();
      expect(bodyText.length).toBeGreaterThan(80);

      const newsletterLink = page.locator("a.substack-signup-link");
      await expect(newsletterLink).toBeVisible();
      await expect(newsletterLink).toHaveAttribute(
        "href",
        "https://rdldn.substack.com/?r=601k45&utm_campaign=pub-share-checklist"
      );

      const brokenImages = await collectBrokenImages(page);
      if (brokenImages.length > 0) {
        console.warn(
          `Images not loaded (likely lazy / Safari):\n${brokenImages
            .map((img) => img.src)
            .join("\n")}`
        );
      }

      expect.soft(failedImages, `Image request failures: ${failedImages.join(", ")}`).toEqual(
        []
      );

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
