import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-1",
  pageId: "6806",
  title: "Best Cauliflower Cheese in London",
  content: "<p>Cauliflower cheese roundup intro</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/page.jpg",
      altText: "Cauliflower cheese"
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
    opengraphDescription: "Cauliflower cheese SEO description"
  }
};

const mockPosts = [
  {
    title: "Cauliflower Champion",
    slug: "slug-1",
    highlights: { loved: "Epic cauliflower cheese", loathed: "None" },
    ratings: { nodes: [{ name: "4.8" }] },
    yearsOfVisit: { nodes: [{ name: "2024" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/p1.jpg", altText: "P1" } }
  },
  {
    title: "No Cauliflower Here",
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
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

describe("best-cauliflower-cheese-in-london page", () => {
  test("renders top cauliflower-cheese posts and comments block", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-cauliflower-cheese-in-london.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Cauliflower Cheese in London");
    expect(html).toContain("Cauliflower Champion");
    expect(html).not.toContain("No Cauliflower Here");
    expect(html).toContain("Any comments?");
    expect(html).toContain("Loved:");
    expect(html).toContain("4.80");
  });
});
