import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

const validPost = (slug: string, rating: string) => ({
  title: slug,
  slug,
  featuredImage: { node: { sourceUrl: `https://example.com/${slug}.jpg` } },
  ratings: { nodes: [{ name: rating }] },
});

vi.mock("../../lib/getAllRoastDinnerPosts", () => ({
  getAllRoastDinnerPosts: vi.fn(async () => [
    ...Array.from({ length: 10 }, (_, i) => validPost(`restaurant-${i}`, String(5 + (i % 5)))),
    // Should be filtered out
    { ...validPost("no-rating", "8"), ratings: null },
    { ...validPost("no-image", "8"), featuredImage: null },
    validPost("out-of-range", "15"),
  ]),
}));

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("guessthescore page", () => {
  test("embeds filtered game posts and submit token into the page", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    // Valid posts are passed to the client
    expect(html).toContain("__roastGamePosts");
    expect(html).toContain("restaurant-0");

    // Security token is embedded for score submission
    expect(html).toContain("__roastSubmitToken");

    // Posts missing ratings, images, or with out-of-range scores are excluded
    expect(html).not.toContain('"slug":"no-rating"');
    expect(html).not.toContain('"slug":"no-image"');
    expect(html).not.toContain('"slug":"out-of-range"');
  });
});
