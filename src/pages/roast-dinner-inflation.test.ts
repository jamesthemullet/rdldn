import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();
const getSinglePageDataMock = vi.fn();

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock
}));

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: getSinglePageDataMock
}));

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  )
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  getSinglePageDataMock.mockReset();

  getSinglePageDataMock.mockResolvedValue({
    id: "page-inflation",
    pageId: "6082",
    slug: "roast-dinner-inflation",
    title: "Roast Dinner Inflation",
    content: "<p>Tracking roast prices over time.</p>",
    featuredImage: {
      node: {
        sourceUrl: "https://example.com/inflation-hero.jpg"
      }
    },
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Average roast prices by year.",
      opengraphImage: { sourceUrl: "https://example.com/inflation-og.jpg" }
    }
  });

  fetchGraphQLMock.mockImplementation(async (_query: string, variables: Record<string, unknown> = {}) => {
    const afterCursor = typeof variables.after === "string" ? variables.after : null;

    if (!afterCursor) {
      return {
        posts: {
          nodes: [
            {
              title: "Roast A",
              yearsOfVisit: { nodes: [{ name: "2024" }] },
              prices: { nodes: [{ name: "£20.00" }] }
            },
            {
              title: "Roast B",
              yearsOfVisit: { nodes: [{ name: "2024" }] },
              prices: { nodes: [{ name: "£30.00" }] }
            },
            {
              title: "Roast C",
              yearsOfVisit: { nodes: [{ name: "2025" }] },
              prices: { nodes: [{ name: "£28.00" }] }
            },
            {
              title: "Missing Price",
              yearsOfVisit: { nodes: [{ name: "2025" }] },
              prices: { nodes: [] }
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
            title: "Roast D",
            yearsOfVisit: { nodes: [{ name: "2025" }] },
            prices: { nodes: [{ name: "£32.00" }] }
          },
          {
            title: "Bad Price",
            yearsOfVisit: { nodes: [{ name: "2025" }] },
            prices: { nodes: [{ name: "price unknown" }] }
          },
          {
            title: "Missing Year",
            yearsOfVisit: { nodes: [] },
            prices: { nodes: [{ name: "£25.00" }] }
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

describe("roast-dinner-inflation page", () => {
  test("renders yearly average prices from paginated roast price data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T00:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: Page } = await import("./roast-dinner-inflation.astro");
    const html = await container.renderToString(Page);

    expect(getSinglePageDataMock).toHaveBeenCalledWith({ variables: { id: "6082" } });
    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Roast Dinner Inflation");
    expect(html).toContain("Tracking roast prices over time.");

    expect(html).toContain("The average price in 2024 is £25.00 (2 reviews)");
    expect(html).toContain("The average price in 2025 is £30.00 (2 reviews)");

    const index2024 = html.indexOf("The average price in 2024");
    const index2025 = html.indexOf("The average price in 2025");
    expect(index2024).toBeGreaterThan(-1);
    expect(index2025).toBeGreaterThan(-1);
    expect(index2024).toBeLessThan(index2025);

    expect(html).toContain("Roast dinner inflation is not transitory.");
    expect(html).toContain("Get new roast reviews direct to your inbox");
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners in London/);
  });
});
