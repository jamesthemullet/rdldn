import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

const mockPage = {
  pageId: "9145",
  title: "How Many Great Roast Dinners Each Year?",
  content: "<p>Yearly count of top roast dinners.</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Great roast dinners by year.",
    opengraphImage: { sourceUrl: "https://example.com/great-roasts-og.jpg" }
  },
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/great-roasts-hero.jpg"
    }
  }
};

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => mockPage)
}));

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock
}));

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    const AstroImageComponent = ImageComponent as typeof ImageComponent & {
      isAstroComponentFactory: boolean;
    };
    AstroImageComponent.isAstroComponentFactory = true;
    return AstroImageComponent;
  })()
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  vi.resetModules();

  fetchGraphQLMock.mockImplementation(async (_query: string, variables: Record<string, unknown> = {}) => {
    const afterCursor = typeof variables.after === "string" ? variables.after : null;

    if (!afterCursor) {
      return {
        posts: {
          nodes: [
            {
              yearsOfVisit: { nodes: [{ name: "2026" }] },
              ratings: { nodes: [{ name: "8.2" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
            },
            {
              yearsOfVisit: { nodes: [{ name: "2026" }] },
              ratings: { nodes: [{ name: "7.1" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
            },
            {
              yearsOfVisit: { nodes: [{ name: "2026" }] },
              ratings: { nodes: [{ name: "9.9" }] },
              typesOfPost: { nodes: [{ name: "Not Roast Dinner" }] }
            },
            {
              yearsOfVisit: { nodes: [{ name: "2025" }] },
              ratings: { nodes: [{ name: "9.0" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
            },
            {
              yearsOfVisit: { nodes: [] },
              ratings: { nodes: [{ name: "8.8" }] },
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
            yearsOfVisit: { nodes: [{ name: "2025" }] },
            ratings: { nodes: [{ name: "5.5" }] },
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
          },
          {
            yearsOfVisit: { nodes: [{ name: "2025" }] },
            ratings: { nodes: [{ name: "not-a-number" }] },
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("how-many-great-roast-dinners-each-year page", () => {
  test("renders yearly counts for great roasts using paginated roast-only data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T00:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: Page } = await import("./how-many-great-roast-dinners-each-year.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("How Many Great Roast Dinners Each Year?");
    expect(html).toContain("Yearly count of top roast dinners.");

    expect(html).toMatch(
      /The number of really good roast dinners in 2026 is\s+1 \(50% of roasts\)\./
    );
    expect(html).toMatch(
      /The number of really good roast dinners in 2025 was\s+1 \(33% of roasts\)\./
    );

    const year2026Index = html.indexOf("in 2026");
    const year2025Index = html.indexOf("in 2025");
    expect(year2026Index).toBeGreaterThan(-1);
    expect(year2025Index).toBeGreaterThan(-1);
    expect(year2026Index).toBeLessThan(year2025Index);

    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners in London/);
  });
});
