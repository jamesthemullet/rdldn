import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-yorkshire",
  pageId: "6728",
  title: "Best Yorkshire Puddings In London",
  content: "<p>Yorkshire pudding roundup intro</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/yorkshire-page.jpg",
      altText: "Yorkshire pudding"
    }
  },
  comments: {
    nodes: []
  },
  seo: {
    opengraphImage: { sourceUrl: "https://example.com/yorkshire-og.jpg" },
    opengraphDescription: "Yorkshire SEO description"
  }
};

const mockPosts = [
  {
    title: "Yorkie Hero",
    slug: "yorkie-hero",
    highlights: { loved: "Massive yorkie", loathed: "None" },
    ratings: { nodes: [{ name: "4.9" }] },
    yearsOfVisit: { nodes: [{ name: "2025" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/yorkshire-1.jpg", altText: "Yorkshire 1" } }
  },
  {
    title: "Gravy Great",
    slug: "gravy-great",
    highlights: { loved: "Outstanding gravy" },
    ratings: { nodes: [{ name: "4.4" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/yorkshire-2.jpg", altText: "Yorkshire 2" } }
  }
];

vi.mock("../lib/api", () => {
  return {
    fetchGraphQL: vi.fn(async (_query: string, variables: Record<string, unknown> = {}) => {
      if ("id" in variables) {
        return { page: mockPage };
      }

      return {
        posts: {
          nodes: mockPosts,
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        }
      };
    })
  };
});

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

describe("best-yorkshire-puddings-in-london page", () => {
  test("renders top yorkshire pudding posts and comments block", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-yorkshire-puddings-in-london.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Yorkshire Puddings In London");
    expect(html).toContain("Yorkie Hero");
    expect(html).not.toContain("Gravy Great");
    expect(html).toContain("Any comments?");
    expect(html).toContain("Loved:");
    expect(html).toContain("4.90");
  });
});
