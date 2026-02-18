import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "7317",
  title: "Best Roast Dinners Near Angel",
  content: "<p>Angel intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Angel description",
    opengraphImage: { sourceUrl: "https://example.com/angel-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/angel.jpg" } }
};

const mockPosts = [
  {
    title: "Angel Roast",
    slug: "angel-roast",
    tubeStations: { nodes: [{ name: "Angel" }] },
    closedDowns: { nodes: [] },
    highlights: { loved: "Great yorkshire" },
    ratings: { nodes: [{ name: "8.3" }] },
    yearsOfVisit: { nodes: [{ name: "2025" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/a1.jpg", altText: "Angel Roast" } }
  },
  {
    title: "Not Near Angel",
    slug: "not-near-angel",
    tubeStations: { nodes: [{ name: "Wimbledon" }] },
    closedDowns: { nodes: [] },
    ratings: { nodes: [{ name: "8.9" }] }
  }
];

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => mockPage)
}));

vi.mock("../lib/api", () => ({
  fetchGraphQL: vi.fn(async () => ({
    posts: { nodes: mockPosts, pageInfo: { hasNextPage: false, endCursor: null } }
  }))
}));

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    const AstroImageComponent = ImageComponent as typeof ImageComponent & {
      isAstroComponentFactory: boolean;
    };
    AstroImageComponent.isAstroComponentFactory = true;
    return AstroImageComponent;
  })()
}));

describe("best-roast-dinners-near-angel page", () => {
  test("renders Angel page and filters by target stations", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-near-angel.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners Near Angel");
    expect(html).toContain("Angel Roast");
    expect(html).not.toContain("Not Near Angel");
    expect(html).toContain("Any comments?");
  });
});
