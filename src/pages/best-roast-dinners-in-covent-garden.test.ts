import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "8598",
  title: "Best Roast Dinners in Covent Garden",
  content: "<p>Covent Garden intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Covent Garden description",
    opengraphImage: { sourceUrl: "https://example.com/cg-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/cg.jpg" } }
};

const mockPosts = [
  {
    title: "Covent Hero",
    slug: "covent-hero",
    tags: { nodes: [{ name: "Covent Garden" }] },
    closedDowns: { nodes: [] },
    highlights: { loved: "Excellent gravy" },
    ratings: { nodes: [{ name: "8.6" }] },
    yearsOfVisit: { nodes: [{ name: "2024" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/c1.jpg", altText: "Covent Hero" } }
  },
  {
    title: "Not Covent",
    slug: "not-covent",
    tags: { nodes: [{ name: "Soho" }] },
    closedDowns: { nodes: [] },
    ratings: { nodes: [{ name: "9.4" }] }
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

describe("best-roast-dinners-in-covent-garden page", () => {
  test("renders Covent Garden page and filters to Covent Garden roasts", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-in-covent-garden.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners in Covent Garden");
    expect(html).toContain("Covent Hero");
    expect(html).not.toContain("Not Covent");
    expect(html).toContain("Any comments?");
  });
});
