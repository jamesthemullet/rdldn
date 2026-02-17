import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";
import { fetchTopRatedRoasts } from "../lib/graphql";

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

const mockPage = {
  pageId: "5616",
  title: "Best Roast Dinner in North London",
  content: "<p>North intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "North description",
    opengraphImage: { sourceUrl: "https://example.com/north-og.jpg" }
  }
};

vi.mock("../lib/graphql", () => ({
  fetchPageData: vi.fn(async () => mockPage),
  fetchTopRatedRoasts: vi.fn(async () => ({
    topRated: [
      {
        title: "North Star",
        slug: "north-star",
        highlights: { loved: "Top crackling", loathed: "None" },
        ratings: { nodes: [{ name: "9.0" }] },
        yearsOfVisit: { nodes: [{ name: "2025" }] },
        featuredImage: { node: { sourceUrl: "https://example.com/north.jpg", altText: "North" } }
      }
    ],
    highRated: [{ slug: "north-second", name: "North Second", rating: 8.2 }]
  }))
}));

describe("best-roast-dinner-in-north-london page", () => {
  test("renders north page with top and high rated roasts", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinner-in-north-london.astro");
    const html = await container.renderToString(Page);

    expect(vi.mocked(fetchTopRatedRoasts)).toHaveBeenCalledWith("North London");
    expect(html).toContain("Best Roast Dinner in North London");
    expect(html).toContain("North Star");
    expect(html).toContain("North Second");
    expect(html).toContain("Any comments?");
  });
});
