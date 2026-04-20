import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => ({
    id: "page-area-cheap",
    pageId: "7140",
    slug: "which-area-of-london-has-the-cheapest-roast-dinners",
    title: "Which Area Of London Has The Cheapest Roast Dinners?",
    content: "<p>Average roast prices by area.</p>",
    featuredImage: { node: { sourceUrl: "https://example.com/area-cheap.jpg" } },
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Cheapest roast areas.",
      opengraphImage: { sourceUrl: "https://example.com/area-cheap-og.jpg" }
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
            { areas: { nodes: [{ name: "East London" }] }, prices: { nodes: [{ name: "£20" }] } },
            { areas: { nodes: [{ name: "East London" }] }, prices: { nodes: [{ name: "£22" }] } },
            { areas: { nodes: [{ name: "East London" }] }, prices: { nodes: [{ name: "£24" }] } },
            { areas: { nodes: [{ name: "West London" }] }, prices: { nodes: [{ name: "£30" }] } },
            { areas: { nodes: [{ name: "West London" }] }, prices: { nodes: [{ name: "£32" }] } },
            { areas: { nodes: [{ name: "North London" }] }, prices: { nodes: [{ name: "£100" }] } },
            { areas: { nodes: [] }, prices: { nodes: [{ name: "£1" }] } },
            { areas: { nodes: [{ name: "Ignored Missing Price" }] }, prices: { nodes: [] } }
          ],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" }
        }
      };
    }

    return {
      posts: {
        nodes: [
          { areas: { nodes: [{ name: "East London" }] }, prices: { nodes: [{ name: "£26" }] } },
          { areas: { nodes: [{ name: "East London" }] }, prices: { nodes: [{ name: "£28" }] } },
          { areas: { nodes: [{ name: "West London" }] }, prices: { nodes: [{ name: "£34" }] } },
          { areas: { nodes: [{ name: "West London" }] }, prices: { nodes: [{ name: "£36" }] } },
          { areas: { nodes: [{ name: "West London" }] }, prices: { nodes: [{ name: "£38" }] } },
          { areas: { nodes: [{ name: "Ignored Bad Price" }] }, prices: { nodes: [{ name: "unknown" }] } },
          { areas: { nodes: [{ name: "Ignored Zero Price" }] }, prices: { nodes: [{ name: "£0" }] } }
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

describe("which-area-of-london-has-the-cheapest-roast-dinners page", () => {
  test("renders area averages with minimum review threshold sorted by cheapest", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./which-area-of-london-has-the-cheapest-roast-dinners.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Which Area Of London Has The Cheapest Roast Dinners?");
    expect(html).toMatch(/The average price in\s+East London\s+is\s+£24\.00\s*\(\s*5\s+reviews\)/);
    expect(html).toMatch(/The average price in\s+West London\s+is\s+£34\.00\s*\(\s*5\s+reviews\)/);
    expect(html).not.toContain("North London");
    expect(html).not.toContain("Ignored Missing Price");
    expect(html).not.toContain("Ignored Bad Price");
    expect(html).not.toContain("Ignored Zero Price");

    const eastIndex = html.indexOf("East London");
    const westIndex = html.indexOf("West London");
    expect(eastIndex).toBeLessThan(westIndex);
    expect(html).toContain("Any comments?");
  });
});
