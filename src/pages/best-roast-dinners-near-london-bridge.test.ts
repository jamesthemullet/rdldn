import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "7271",
  title: "Best Roast Dinners Near London Bridge",
  content: "<p>London Bridge intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "London Bridge description",
    opengraphImage: { sourceUrl: "https://example.com/lb-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/lb.jpg" } }
};

const mockPosts = [
  {
    title: "Bridge Roast",
    slug: "bridge-roast",
    tubeStations: { nodes: [{ name: "London Bridge" }] },
    closedDowns: { nodes: [] },
    highlights: { loved: "Excellent pork" },
    ratings: { nodes: [{ name: "8.4" }] },
    yearsOfVisit: { nodes: [{ name: "2024" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/lb1.jpg", altText: "Bridge Roast" } }
  },
  {
    title: "Far Away Roast",
    slug: "far-away-roast",
    tubeStations: { nodes: [{ name: "Richmond" }] },
    closedDowns: { nodes: [] },
    ratings: { nodes: [{ name: "9.0" }] }
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

describe("best-roast-dinners-near-london-bridge page", () => {
  test("renders London Bridge page and filters by target stations", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-near-london-bridge.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners Near London Bridge");
    expect(html).toContain("Bridge Roast");
    expect(html).not.toContain("Far Away Roast");
    expect(html).toContain("Any comments?");
  });
});
