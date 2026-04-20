import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => ({
    id: "page-borough-best",
    pageId: "6277",
    slug: "which-borough-has-the-best-roast-dinners-in-london",
    title: "Which Borough Has The Best Roast Dinners In London?",
    content: "<p>Borough averages by roast rating.</p>",
    featuredImage: { node: { sourceUrl: "https://example.com/borough-best.jpg" } },
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Best borough roast averages.",
      opengraphImage: { sourceUrl: "https://example.com/borough-best-og.jpg" }
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
            { boroughs: { nodes: [{ name: "Hackney" }] }, ratings: { nodes: [{ name: "9.0" }] } },
            { boroughs: { nodes: [{ name: "Hackney" }] }, ratings: { nodes: [{ name: "8.0" }] } },
            { boroughs: { nodes: [{ name: "Westminster" }] }, ratings: { nodes: [{ name: "7.0" }] } },
            { boroughs: { nodes: [{ name: "Westminster" }] }, ratings: { nodes: [{ name: "7.5" }] } },
            { boroughs: { nodes: [{ name: "Camden" }] }, ratings: { nodes: [{ name: "10.0" }] } },
            { boroughs: { nodes: [] }, ratings: { nodes: [{ name: "9.9" }] } }
          ],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" }
        }
      };
    }

    return {
      posts: {
        nodes: [
          { boroughs: { nodes: [{ name: "Hackney" }] }, ratings: { nodes: [{ name: "8.5" }] } },
          { boroughs: { nodes: [{ name: "Westminster" }] }, ratings: { nodes: [{ name: "8.0" }] } },
          { boroughs: { nodes: [{ name: "Ignored Missing Rating" }] }, ratings: { nodes: [] } },
          { boroughs: { nodes: [{ name: "Ignored Bad Rating" }] }, ratings: { nodes: [{ name: "not-a-number" }] } },
          { boroughs: { nodes: [{ name: "Ignored Zero" }] }, ratings: { nodes: [{ name: "0" }] } }
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

describe("which-borough-has-the-best-roast-dinners-in-london page", () => {
  test("renders borough averages with minimum 3 reviews sorted high to low", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./which-borough-has-the-best-roast-dinners-in-london.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Which Borough Has The Best Roast Dinners In London?");
    expect(html).toMatch(/The average rating in\s+Hackney\s+is\s+8\.50\s*\(3\s+reviews\)/);
    expect(html).toMatch(/The average rating in\s+Westminster\s+is\s+7\.50\s*\(3\s+reviews\)/);
    expect(html).not.toContain("Camden");
    expect(html).not.toContain("Ignored Missing Rating");
    expect(html).not.toContain("Ignored Bad Rating");
    expect(html).not.toContain("Ignored Zero");

    const hackneyIndex = html.indexOf("Hackney");
    const westminsterIndex = html.indexOf("Westminster");
    expect(hackneyIndex).toBeLessThan(westminsterIndex);
    expect(html).toContain("Any comments?");
  });
});
