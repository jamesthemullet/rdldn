import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
});

describe("featured-post-header component", () => {
  test("uses the title as the default image alt text and renders the current year", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-30T12:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: FeaturedPostHeader } = await import("./featured-post-header.astro");

    const html = await container.renderToString(FeaturedPostHeader, {
      props: {
        imageSrc: "https://example.com/featured.jpg",
        title: "Sunday roast special"
      }
    });

    expect(html).toContain('src="https://example.com/featured.jpg"');
    expect(html).toContain('alt="Sunday roast special"');
    expect(html).toContain('class="featured-image"');
    expect(html).toContain("2026 Roast Dinners in London. All rights reserved.");
    expect(html).toMatch(/<h2[^>]*>Sunday roast special<\/h2>/);
  });

  test("uses an explicit image alt text when provided", async () => {
    const container = await AstroContainer.create();
    const { default: FeaturedPostHeader } = await import("./featured-post-header.astro");

    const html = await container.renderToString(FeaturedPostHeader, {
      props: {
        imageSrc: "https://example.com/featured.jpg",
        title: "Sunday roast special",
        imageAlt: "Carved beef roast"
      }
    });

    expect(html).toContain('alt="Carved beef roast"');
    expect(html).not.toContain('alt="Sunday roast special"');
  });
});