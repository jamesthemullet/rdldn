import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-1",
  pageId: "5992",
  title: "Best Gravy in London",
  content: "<p>Gravy roundup intro</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/page.jpg",
      altText: "Gravy"
    }
  },
  comments: {
    nodes: [
      {
        id: "c1",
        parentId: undefined,
        author: { node: { name: "Alice", avatar: { url: "https://example.com/a.png" } } },
        date: "2024-01-01",
        content: { rendered: "Parent comment" },
        replies: []
      }
    ]
  },
  seo: {
    opengraphImage: { sourceUrl: "https://example.com/og.jpg" },
    opengraphDescription: "Gravy SEO description"
  }
};

const mockPosts = [
  {
    title: "Gravy Great",
    slug: "slug-1",
    highlights: { loved: "Silky gravy", loathed: "None" },
    ratings: { nodes: [{ name: "4.7" }] },
    yearsOfVisit: { nodes: [{ name: "2024" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/p1.jpg", altText: "P1" } }
  },
  {
    title: "No Gravy Star",
    slug: "slug-2",
    highlights: { loved: "Crispy potatoes" },
    ratings: { nodes: [{ name: "4.1" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/p2.jpg", altText: "P2" } }
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

describe("best-gravy-in-london page", () => {
  test("renders top gravy posts and comments block", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-gravy-in-london.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Gravy in London");
    expect(html).toContain("Gravy Great");
    expect(html).not.toContain("No Gravy Star");
    expect(html).toContain("Any comments?");
    expect(html).toContain("Loved:");
    expect(html).toContain("4.70");
  });
});
