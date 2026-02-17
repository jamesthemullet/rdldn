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
  pageId: "5594",
  title: "Best Roast Dinner in South London",
  content: "<p>South intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "South description",
    opengraphImage: { sourceUrl: "https://example.com/south-og.jpg" }
  }
};

vi.mock("../lib/graphql", () => ({
  fetchPageData: vi.fn(async () => mockPage),
  fetchTopRatedRoasts: vi.fn(async () => ({
    topRated: [
      {
        title: "South Hero",
        slug: "south-hero",
        highlights: { loved: "Great gravy", loathed: "None" },
        ratings: { nodes: [{ name: "8.8" }] },
        yearsOfVisit: { nodes: [{ name: "2024" }] },
        featuredImage: { node: { sourceUrl: "https://example.com/south.jpg", altText: "South" } }
      }
    ],
    highRated: [{ slug: "south-second", name: "South Second", rating: 8.0 }]
  }))
}));

describe("best-roast-dinner-in-south-london page", () => {
  test("renders south page with top and high rated roasts", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinner-in-south-london.astro");
    const html = await container.renderToString(Page);

    expect(vi.mocked(fetchTopRatedRoasts)).toHaveBeenCalledWith("South London");
    expect(html).toContain("Best Roast Dinner in South London");
    expect(html).toContain("South Hero");
    expect(html).toContain("South Second");
    expect(html).toContain("Any comments?");
  });
});
