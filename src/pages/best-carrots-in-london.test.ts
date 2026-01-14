import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-1",
  pageId: "6788",
  title: "Best Carrots in London",
  content: "<p>Carrot roundup intro</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/page.jpg",
      altText: "Carrots"
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
      },
      {
        id: "c2",
        parentId: "c1",
        author: { node: { name: "Bob", avatar: { url: "https://example.com/b.png" } } },
        date: "2024-01-02",
        content: { rendered: "Child comment" },
        replies: []
      }
    ]
  },
  seo: {
    opengraphImage: { sourceUrl: "https://example.com/og.jpg" },
    opengraphDescription: "Carrot SEO description"
  }
};

const mockPosts = [
  {
    title: "Carrot King",
    slug: "slug-1",
    highlights: { loved: "Carrot magic", loathed: "None" },
    ratings: { nodes: [{ name: "4.8" }] },
    yearsOfVisit: { nodes: [{ name: "2024" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/p1.jpg", altText: "P1" } }
  },
  {
    title: "No Carrots Here",
    slug: "slug-2",
    highlights: { loved: "Beef focus" },
    ratings: { nodes: [{ name: "4.2" }] },
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
    // Mark as Astro component factory so the renderer path is used.
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

describe("best-carrots-in-london page", () => {
  test("renders top carrot posts and comments block", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-carrots-in-london.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Carrots in London");
    expect(html).toContain("Carrot King");
    expect(html).not.toContain("No Carrots Here");
    expect(html).toContain("Any comments?");
    expect(html).toContain("Loved:");
    expect(html).toContain("4.80");
  });
});
