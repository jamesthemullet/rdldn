import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-potatoes",
  pageId: "6760",
  title: "Best Roast Potatoes In London",
  content: "<p>Roast potatoes roundup intro</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/potatoes-page.jpg",
      altText: "Potatoes"
    }
  },
  comments: {
    nodes: []
  },
  seo: {
    opengraphImage: { sourceUrl: "https://example.com/potatoes-og.jpg" },
    opengraphDescription: "Potatoes SEO description"
  }
};

const mockPosts = [
  {
    title: "Roasties Royalty",
    slug: "roasties-royalty",
    highlights: { loved: "Unreal roasties", loathed: "None" },
    ratings: { nodes: [{ name: "4.6" }] },
    yearsOfVisit: { nodes: [{ name: "2025" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/potatoes-1.jpg", altText: "Potatoes 1" } }
  },
  {
    title: "Mash Only",
    slug: "mash-only",
    highlights: { loved: "Creamy mashed potato" },
    ratings: { nodes: [{ name: "4.2" }] },
    closedDowns: { nodes: [] },
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/potatoes-2.jpg", altText: "Potatoes 2" } }
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

describe("best-roast-potatoes-in-london page", () => {
  test("renders top roast potato posts and comments block", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-potatoes-in-london.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Potatoes In London");
    expect(html).toContain("Roasties Royalty");
    expect(html).not.toContain("Mash Only");
    expect(html).toContain("Any comments?");
    expect(html).toContain("Loved:");
    expect(html).toContain("4.60");
  });
});
