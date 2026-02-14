import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-winter-analysis",
  pageId: "9266",
  title: "Are Roast Dinners Better In Winter?",
  content: "<p>Seasonal roast dinner comparison.</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/winter-analysis.jpg",
      altText: "Seasonal roast dinners"
    }
  },
  comments: {
    nodes: []
  },
  seo: {
    opengraphImage: { sourceUrl: "https://example.com/winter-analysis-og.jpg" },
    opengraphDescription: "Are roast dinners better in winter?"
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
                date: "2024-01-14T12:00:00.000Z",
                ratings: { nodes: [{ name: "8.0" }] },
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
              },
              {
                date: "2024-04-14T12:00:00.000Z",
                ratings: { nodes: [{ name: "6.0" }] },
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
              },
              {
                date: "2024-07-14T12:00:00.000Z",
                ratings: { nodes: [{ name: "9.0" }] },
                typesOfPost: { nodes: [{ name: "Not Roast" }] }
              },
              {
                date: "2024-10-14T12:00:00.000Z",
                ratings: { nodes: [{ name: "not-a-number" }] },
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
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
              date: "2024-07-20T12:00:00.000Z",
              ratings: { nodes: [{ name: "7.0" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
            },
            {
              date: "2024-10-20T12:00:00.000Z",
              ratings: { nodes: [{ name: "5.0" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
            },
            {
              date: "2024-12-20T12:00:00.000Z",
              ratings: { nodes: [{ name: "9.0" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
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

describe("are-roast-dinners-better-in-winter page", () => {
  test("renders seasonal averages, totals, and comments section", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T00:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: Page } = await import("./are-roast-dinners-better-in-winter.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Are Roast Dinners Better In Winter?");
    expect(html).toContain("Seasonal roast dinner comparison.");
    expect(html).toContain("In Winter, the average roast dinner rating is");
    expect(html).toContain("8.50");
    expect(html).toContain("based on 2 reviews");
    expect(html).toContain("In Spring, the average roast dinner rating is");
    expect(html).toContain("6.00");
    expect(html).toContain("based on 1 reviews");
    expect(html).toContain("In Summer, the average roast dinner rating is");
    expect(html).toContain("7.00");
    expect(html).toContain("In Autumn, the average roast dinner rating is");
    expect(html).toContain("5.00");
    expect(html).toContain("Total reviews counted: 5");
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners in London/);
  });
});
