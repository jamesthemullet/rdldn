import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => ({
    id: "page-month",
    pageId: "9289",
    slug: "which-month-are-roast-dinners-better",
    title: "Which Month Are Roast Dinners Better?",
    content: "<p>Monthly roast rating averages.</p>",
    featuredImage: { node: { sourceUrl: "https://example.com/month.jpg" } },
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Roast ratings by month.",
      opengraphImage: { sourceUrl: "https://example.com/month-og.jpg" }
    }
  }))
}));

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock
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
  vi.resetModules();

  fetchGraphQLMock.mockImplementation(async (_query: string, variables: Record<string, unknown> = {}) => {
    if (!variables.after) {
      return {
        posts: {
          nodes: [
            { date: "2024-01-10T10:00:00.000Z", ratings: { nodes: [{ name: "9.0" }] } },
            { date: "2024-02-05T10:00:00.000Z", ratings: { nodes: [{ name: "7.5" }] } },
            { date: "", ratings: { nodes: [{ name: "8.5" }] } },
            { date: "2024-03-12T10:00:00.000Z", ratings: { nodes: [{ name: "not-a-number" }] } },
            { date: "2024-04-12T10:00:00.000Z", ratings: undefined },
            { date: "+010000-01-01T00:00:00.000Z", ratings: { nodes: [{ name: "8.8" }] } }
          ],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" }
        }
      };
    }

    return {
      posts: {
        nodes: [
          { date: "2024-01-20T10:00:00.000Z", ratings: { nodes: [{ name: "8.0" }] } }
        ],
        pageInfo: { hasNextPage: false, endCursor: null }
      }
    };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("which-month-are-roast-dinners-better page", () => {
  test("renders month-by-month averages and N/A for months without data", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./which-month-are-roast-dinners-better.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Which Month Are Roast Dinners Better?");
    expect(html).toMatch(/In January, the average roast dinner rating is\s+8\.50 based on\s+2\s+reviews\./);
    expect(html).toMatch(/In February, the average roast dinner rating is\s+7\.50 based on\s+1\s+review\./);
    expect(html).toMatch(/In March, the average roast dinner rating is\s+N\/A based on\s+0\s+reviews\./);
    expect(html).toMatch(/In December, the average roast dinner rating is\s+N\/A based on\s+0\s+reviews\./);
    expect(html).toContain("Any comments?");
  });
});
