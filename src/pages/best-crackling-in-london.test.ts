import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-1",
  pageId: "10960",
  title: "Best Crackling in London",
  content: "<p>Crackling roundup intro</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/page.jpg",
      altText: "Crackling"
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
    opengraphDescription: "Crackling SEO description"
  }
};

const mockPosts = [
  {
    title: "Crackling King",
    slug: "slug-1",
    highlights: { loved: "Ultra crisp crackling", loathed: "None" },
    ratings: { nodes: [{ name: "4.65" }] },
    yearsOfVisit: { nodes: [{ name: "2024" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/p1.jpg", altText: "P1" } }
  },
  {
    title: "No Crackling Mention",
    slug: "slug-2",
    highlights: { loved: "Great beef" },
    ratings: { nodes: [{ name: "4.0" }] },
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

describe("best-crackling-in-london page", () => {
  test("renders top crackling posts and comments block", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-crackling-in-london.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Crackling in London");
    expect(html).toContain("Crackling King");
    expect(html).not.toContain("No Crackling Mention");
    expect(html).toContain("Any comments?");
    expect(html).toContain("Loved:");
    expect(html).toContain("4.65");
  });
});
