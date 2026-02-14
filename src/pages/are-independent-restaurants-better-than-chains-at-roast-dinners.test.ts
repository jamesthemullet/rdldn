import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-independent-vs-chain",
  pageId: "10608",
  title: "Are Independent Restaurants Better Than Chains At Roast Dinners?",
  content: "<p>Comparing independent restaurants and chains for roast dinners.</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/independent-vs-chain.jpg",
      altText: "Independent vs chain"
    }
  },
  comments: {
    nodes: []
  },
  seo: {
    opengraphImage: { sourceUrl: "https://example.com/independent-vs-chain-og.jpg" },
    opengraphDescription: "Independent versus chain roast dinner scores"
  }
};

vi.mock("../lib/api", () => {
  return {
    fetchGraphQL: vi.fn(async (_query: string, variables: Record<string, unknown> = {}) => {
      if ("id" in variables) {
        return { page: mockPage };
      }

      const afterCursor = typeof variables.after === "string" ? variables.after : null;

      if (!afterCursor) {
        return {
          posts: {
            nodes: [
              {
                ratings: { nodes: [{ name: "4.0" }] },
                owners: { nodes: [{ name: "independent" }] }
              },
              {
                ratings: { nodes: [{ name: "3.5" }] },
                owners: { nodes: [{ name: "Chain" }] }
              },
              {
                ratings: { nodes: [{ name: "not-a-number" }] },
                owners: { nodes: [{ name: "independent" }] }
              },
              {
                ratings: { nodes: [{ name: "4.8" }] },
                owners: { nodes: [] }
              }
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: "cursor-1"
            }
          }
        };
      }

      return {
        posts: {
          nodes: [
            {
              ratings: { nodes: [{ name: "5.0" }] },
              owners: { nodes: [{ name: "Independent" }] }
            },
            {
              ratings: { nodes: [{ name: "2.0" }] },
              owners: { nodes: [{ name: "Franchise" }] }
            }
          ],
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

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("are-independent-restaurants-better-than-chains-at-roast-dinners page", () => {
  test("renders calculated independent and non-independent metrics", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T00:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: Page } = await import("./are-independent-restaurants-better-than-chains-at-roast-dinners.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Are Independent Restaurants Better Than Chains At Roast Dinners?");
    expect(html).toContain("Comparing independent restaurants and chains for roast dinners.");
    expect(html).toContain("Number of independent restaurants: 2");
    expect(html).toContain("Number of non-independent restaurants: 2");
    expect(html).toContain("Average score for independent restaurants: 4.50");
    expect(html).toContain("Average score for non-independent restaurants: 2.75");
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners in London/);
  });
});
