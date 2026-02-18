import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "8407",
  title: "Best Roast Dinners in Soho",
  content: "<p>Soho intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Soho description",
    opengraphImage: { sourceUrl: "https://example.com/soho-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/soho.jpg" } }
};

const mockPosts = [
  {
    title: "Soho Star",
    slug: "soho-star",
    tags: { nodes: [{ name: "Soho" }] },
    closedDowns: { nodes: [] },
    highlights: { loved: "Great gravy" },
    ratings: { nodes: [{ name: "8.9" }] },
    yearsOfVisit: { nodes: [{ name: "2025" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/s1.jpg", altText: "Soho Star" } }
  },
  {
    title: "Not Soho",
    slug: "not-soho",
    tags: { nodes: [{ name: "Camden" }] },
    closedDowns: { nodes: [] },
    ratings: { nodes: [{ name: "9.3" }] }
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

describe("best-roast-dinners-in-soho page", () => {
  test("renders Soho page and filters to Soho roasts", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-in-soho.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners in Soho");
    expect(html).toContain("Soho Star");
    expect(html).not.toContain("Not Soho");
    expect(html).toContain("Any comments?");
  });
});
