import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-pork",
  pageId: "10965",
  title: "Best Roast Pork In London",
  content: "<p>Pork roundup intro</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/pork-page.jpg",
      altText: "Pork"
    }
  },
  comments: {
    nodes: []
  },
  seo: {
    opengraphImage: { sourceUrl: "https://example.com/pork-og.jpg" },
    opengraphDescription: "Pork SEO description"
  }
};

const mockPosts = [
  {
    title: "Pork Champion",
    slug: "pork-champion",
    highlights: { loved: "Juicy roast pork shoulder", loathed: "None" },
    ratings: { nodes: [{ name: "4.7" }] },
    yearsOfVisit: { nodes: [{ name: "2025" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/pork-1.jpg", altText: "Pork 1" } }
  },
  {
    title: "Pork Belly Place",
    slug: "pork-belly-place",
    highlights: { loved: "Amazing pork belly" },
    ratings: { nodes: [{ name: "4.9" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/pork-2.jpg", altText: "Pork 2" } }
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

describe("best-roast-pork-in-london page", () => {
  test("renders roast pork posts but excludes pork belly mentions", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-pork-in-london.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Pork In London");
    expect(html).toContain("Pork Champion");
    expect(html).not.toContain("Pork Belly Place");
    expect(html).toContain("Any comments?");
    expect(html).toContain("Loved:");
    expect(html).toContain("4.70");
  });
});
