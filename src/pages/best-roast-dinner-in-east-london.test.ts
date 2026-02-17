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
  pageId: "5612",
  title: "Best Roast Dinner in East London",
  content: "<p>East intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "East description",
    opengraphImage: { sourceUrl: "https://example.com/east-og.jpg" }
  }
};

vi.mock("../lib/graphql", () => ({
  fetchPageData: vi.fn(async () => mockPage),
  fetchTopRatedRoasts: vi.fn(async () => ({
    topRated: [
      {
        title: "East Hero",
        slug: "east-hero",
        highlights: { loved: "Great yorkies", loathed: "None" },
        ratings: { nodes: [{ name: "8.9" }] },
        yearsOfVisit: { nodes: [{ name: "2024" }] },
        featuredImage: { node: { sourceUrl: "https://example.com/east.jpg", altText: "East" } }
      }
    ],
    highRated: [{ slug: "east-second", name: "East Second", rating: 8.1 }]
  }))
}));

describe("best-roast-dinner-in-east-london page", () => {
  test("renders east page with top and high rated roasts", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinner-in-east-london.astro");
    const html = await container.renderToString(Page);

    expect(vi.mocked(fetchTopRatedRoasts)).toHaveBeenCalledWith("East London");
    expect(html).toContain("Best Roast Dinner in East London");
    expect(html).toContain("East Hero");
    expect(html).toContain("East Second");
    expect(html).toContain("Any comments?");
  });
});
