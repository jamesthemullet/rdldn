import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => ({
    id: "page-area-best",
    pageId: "10540",
    slug: "which-area-of-london-has-the-best-roast-dinners",
    title: "Which Area Of London Has The Best Roast Dinners?",
    content: "<p>Average ratings by area.</p>",
    featuredImage: { node: { sourceUrl: "https://example.com/area-best.jpg" } },
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Best roast area rankings.",
      opengraphImage: { sourceUrl: "https://example.com/area-best-og.jpg" }
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
            { areas: { nodes: [{ name: "East London" }] }, ratings: { nodes: [{ name: "9.0" }] } },
            { areas: { nodes: [{ name: "East London" }] }, ratings: { nodes: [{ name: "8.0" }] } },
            { areas: { nodes: [{ name: "South London" }] }, ratings: { nodes: [{ name: "7.0" }] } },
            { areas: { nodes: [{ name: "South London" }] }, ratings: { nodes: [{ name: "7.5" }] } },
            { areas: { nodes: [] }, ratings: { nodes: [{ name: "9.9" }] } },
            { areas: { nodes: [{ name: "Ignored Missing Rating" }] }, ratings: { nodes: [] } }
          ],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" }
        }
      };
    }

    return {
      posts: {
        nodes: [
          { areas: { nodes: [{ name: "East London" }] }, ratings: { nodes: [{ name: "8.5" }] } },
          { areas: { nodes: [{ name: "South London" }] }, ratings: { nodes: [{ name: "7.2" }] } },
          { areas: { nodes: [{ name: "North London" }] }, ratings: { nodes: [{ name: "9.8" }] } },
          { areas: { nodes: [{ name: "Ignored Bad Rating" }] }, ratings: { nodes: [{ name: "not-a-number" }] } },
          { areas: { nodes: [{ name: "Ignored Zero" }] }, ratings: { nodes: [{ name: "0" }] } }
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

describe("which-area-of-london-has-the-best-roast-dinners page", () => {
  test("renders average ratings for areas with at least three reviews", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./which-area-of-london-has-the-best-roast-dinners.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(html).toContain("Which Area Of London Has The Best Roast Dinners?");
    expect(html).toMatch(/The average rating in\s+East London\s+is\s+8\.50\s*\(\s*3\s+reviews\)/);
    expect(html).toMatch(/The average rating in\s+South London\s+is\s+7\.23\s*\(\s*3\s+reviews\)/);
    expect(html).not.toContain("North London");
    expect(html).not.toContain("Ignored Missing Rating");
    expect(html).not.toContain("Ignored Bad Rating");
    expect(html).not.toContain("Ignored Zero");

    const eastIndex = html.indexOf("East London");
    const southIndex = html.indexOf("South London");
    expect(eastIndex).toBeLessThan(southIndex);
    expect(html).toContain("Any comments?");
  });
});
