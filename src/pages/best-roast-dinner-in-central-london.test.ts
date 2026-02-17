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
  pageId: "5614",
  title: "Best Roast Dinner in Central London",
  content: "<p>Central intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Central description",
    opengraphImage: { sourceUrl: "https://example.com/central-og.jpg" }
  }
};

vi.mock("../lib/graphql", () => ({
  fetchPageData: vi.fn(async () => mockPage),
  fetchTopRatedRoasts: vi.fn(async () => ({
    topRated: [
      {
        title: "Central Champion",
        slug: "central-champion",
        highlights: { loved: "Perfect roast", loathed: "None" },
        ratings: { nodes: [{ name: "9.1" }] },
        yearsOfVisit: { nodes: [{ name: "2025" }] },
        featuredImage: { node: { sourceUrl: "https://example.com/central.jpg", altText: "Central" } }
      }
    ],
    highRated: [{ slug: "central-second", name: "Central Second", rating: 8.9 }]
  }))
}));

describe("best-roast-dinner-in-central-london page", () => {
  test("renders central page with top and high rated roasts", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinner-in-central-london.astro");
    const html = await container.renderToString(Page);

    expect(vi.mocked(fetchTopRatedRoasts)).toHaveBeenCalledWith("Central London");
    expect(html).toContain("Best Roast Dinner in Central London");
    expect(html).toContain("Central Champion");
    expect(html).toContain("Also Worth a Try");
    expect(html).toContain("Central Second");
    expect(html).toContain("Any comments?");
  });
});
