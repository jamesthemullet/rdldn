import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-yearly-trend",
  pageId: "10544",
  title: "Are Roast Dinners In London Getting Better Or Worse?",
  content: "<p>Tracking roast dinner ratings over time.</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/yearly-trend.jpg",
      altText: "Yearly roast dinner trend"
    }
  },
  comments: {
    nodes: []
  },
  seo: {
    opengraphImage: { sourceUrl: "https://example.com/yearly-trend-og.jpg" },
    opengraphDescription: "Are roast dinners in London getting better or worse?"
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
                yearsOfVisit: { nodes: [{ name: "2023" }] },
                ratings: { nodes: [{ name: "7.0" }] }
              },
              {
                yearsOfVisit: { nodes: [{ name: "2023" }] },
                ratings: { nodes: [{ name: "5.0" }] }
              },
              {
                yearsOfVisit: { nodes: [{ name: "2024" }] },
                ratings: { nodes: [{ name: "not-a-number" }] }
              },
              {
                yearsOfVisit: { nodes: [] },
                ratings: { nodes: [{ name: "9.0" }] }
              },
              {
                yearsOfVisit: { nodes: [{ name: "2022" }] },
                ratings: { nodes: [{ name: "9.0" }] }
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
              yearsOfVisit: { nodes: [{ name: "2024" }] },
              ratings: { nodes: [{ name: "8.0" }] }
            },
            {
              yearsOfVisit: { nodes: [{ name: "2024" }] },
              ratings: { nodes: [{ name: "6.0" }] }
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
    type AstroImageComponent = ((
      _result: unknown,
      props: { src: string; alt?: string }
    ) => string) & { isAstroComponentFactory: boolean };
    const ImageComponent = ((
      _result: unknown,
      props: { src: string; alt?: string }
    ) => `<img src="${props.src}" alt="${props.alt ?? ""}" />`) as AstroImageComponent;
    ImageComponent.isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("are-roast-dinners-in-london-getting-better-or-worse page", () => {
  test("renders yearly averages from paginated roast data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T00:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: Page } = await import("./are-roast-dinners-in-london-getting-better-or-worse.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Are Roast Dinners In London Getting Better Or Worse?");
    expect(html).toContain("Tracking roast dinner ratings over time.");
    expect(html).toMatch(/The average rating in 2022 is 9\.00 \(1\s+review\)/);
    expect(html).toMatch(/The average rating in 2023 is 6\.00 \(2\s+reviews\)/);
    expect(html).toMatch(/The average rating in 2024 is 7\.00 \(2\s+reviews\)/);
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners in London/);
  });
});