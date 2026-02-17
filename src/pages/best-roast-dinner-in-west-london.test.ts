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
  pageId: "5610",
  title: "Best Roast Dinner in West London",
  content: "<p>West intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "West description",
    opengraphImage: { sourceUrl: "https://example.com/west-og.jpg" }
  }
};

vi.mock("../lib/graphql", () => ({
  fetchPageData: vi.fn(async () => mockPage),
  fetchTopRatedRoasts: vi.fn(async () => ({
    topRated: [
      {
        title: "West Winner",
        slug: "west-winner",
        highlights: { loved: "Excellent potatoes", loathed: "None" },
        ratings: { nodes: [{ name: "9.2" }] },
        yearsOfVisit: { nodes: [{ name: "2025" }] },
        featuredImage: { node: { sourceUrl: "https://example.com/west.jpg", altText: "West" } }
      }
    ],
    highRated: [{ slug: "west-second", name: "West Second", rating: 8.4 }]
  }))
}));

describe("best-roast-dinner-in-west-london page", () => {
  test("renders west page with top and high rated roasts", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinner-in-west-london.astro");
    const html = await container.renderToString(Page);

    expect(vi.mocked(fetchTopRatedRoasts)).toHaveBeenCalledWith("West London");
    expect(html).toContain("Best Roast Dinner in West London");
    expect(html).toContain("West Winner");
    expect(html).toContain("West Second");
    expect(html).toContain("Any comments?");
  });
});
