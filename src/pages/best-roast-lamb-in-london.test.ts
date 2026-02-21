import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-lamb",
  pageId: "10963",
  title: "Best Roast Lamb In London",
  content: "<p>Lamb roundup intro</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/lamb-page.jpg",
      altText: "Lamb"
    }
  },
  comments: {
    nodes: []
  },
  seo: {
    opengraphImage: { sourceUrl: "https://example.com/lamb-og.jpg" },
    opengraphDescription: "Lamb SEO description"
  }
};

const mockPosts = [
  {
    title: "Lamb Legend",
    slug: "lamb-legend",
    highlights: { loved: "Perfectly pink lamb", loathed: "None" },
    ratings: { nodes: [{ name: "4.8" }] },
    yearsOfVisit: { nodes: [{ name: "2025" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/lamb-1.jpg", altText: "Lamb 1" } }
  },
  {
    title: "Beef Boss",
    slug: "beef-boss",
    highlights: { loved: "Great beef" },
    ratings: { nodes: [{ name: "4.1" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/lamb-2.jpg", altText: "Lamb 2" } }
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

describe("best-roast-lamb-in-london page", () => {
  test("renders top lamb posts and comments block", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-lamb-in-london.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Lamb In London");
    expect(html).toContain("Lamb Legend");
    expect(html).not.toContain("Beef Boss");
    expect(html).toContain("Any comments?");
    expect(html).toContain("Loved:");
    expect(html).toContain("4.80");
  });
});
