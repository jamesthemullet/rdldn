import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../components/header/HeaderAuth");

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => ({
    id: "page-tube-line-best",
    pageId: "12357",
    slug: "which-tube-line-has-the-best-roast-dinners-in-london",
    title: "Which Tube Line Has The Best Roast Dinners In London?",
    content: "<p>Tube line averages by roast rating.</p>",
    featuredImage: { node: { sourceUrl: "https://example.com/tube-line-best.jpg" } },
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Best tube line roast averages.",
      opengraphImage: { sourceUrl: "https://example.com/tube-line-best-og.jpg" }
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
            {
              tubeLines: { nodes: [{ name: "Elizabeth" }] },
              ratings: { nodes: [{ name: "9.0" }] },
              slug: "the-elizabeth-arms",
              title: "The Elizabeth Arms"
            },
            {
              tubeLines: { nodes: [{ name: "Elizabeth" }] },
              ratings: { nodes: [{ name: "7.0" }] },
              slug: "the-elizabeth-pub",
              title: "The Elizabeth Pub"
            },
            {
              tubeLines: { nodes: [{ name: "Jubilee" }] },
              ratings: { nodes: [{ name: "6.0" }] },
              slug: "the-jubilee-arms",
              title: "The Jubilee Arms"
            },
            {
              tubeLines: { nodes: [{ name: "Jubilee" }] },
              ratings: { nodes: [{ name: "7.0" }] },
              slug: "the-jubilee-inn",
              title: "The Jubilee Inn"
            },
            {
              tubeLines: { nodes: [{ name: "Overground" }] },
              ratings: { nodes: [{ name: "10.0" }] },
              slug: "the-overground-arms",
              title: "The Overground Arms"
            },
            {
              tubeLines: { nodes: [{ name: "Elizabeth" }] },
              ratings: { nodes: [{ name: "not-a-number" }] },
              slug: "bad-rating",
              title: "Bad Rating Roast"
            },
            {
              tubeLines: { nodes: [] },
              ratings: { nodes: [{ name: "8.2" }] },
              slug: "no-line",
              title: "No Line Roast"
            }
          ],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" }
        }
      };
    }

    return {
      posts: {
        nodes: [
          {
            tubeLines: { nodes: [{ name: "Elizabeth" }] },
            ratings: { nodes: [{ name: "8.0" }] },
            slug: "the-elizabeth-tavern",
            title: "The Elizabeth Tavern"
          },
          {
            tubeLines: { nodes: [{ name: "Jubilee" }] },
            ratings: { nodes: [{ name: "8.0" }] },
            slug: "the-jubilee-tavern",
            title: "The Jubilee Tavern"
          },
          {
            tubeLines: { nodes: [{ name: "Jubilee" }] },
            ratings: undefined,
            slug: "missing-rating",
            title: "Missing Rating Roast"
          }
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

describe("which-tube-line-has-the-best-roast-dinners-in-london page", () => {
  test("renders tube line averages with minimum 3 reviews sorted high to low, linking best review and per-line page", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import(
      "./which-tube-line-has-the-best-roast-dinners-in-london.astro"
    );
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Which Tube Line Has The Best Roast Dinners In London?");

    expect(html).toContain('href="/best-roast-dinners-on-the-elizabeth-line"');
    expect(html).toContain("Elizabeth line");
    expect(html).toMatch(/averages\s+8\.00\s+based on\s+3\s+reviews/);

    expect(html).toContain('href="/best-roast-dinners-on-the-jubilee-line"');
    expect(html).toMatch(/averages\s+7\.00\s+based on\s+3\s+reviews/);

    expect(html).toContain('href="/the-elizabeth-arms"');
    expect(html).toContain("The Elizabeth Arms");

    // Overground has only 1 review, below the minimum threshold — excluded
    expect(html).not.toContain("Overground line");
    expect(html).not.toContain("The Overground Arms");

    // Posts with no tube line or an unparsable rating are ignored
    expect(html).not.toContain("No Line Roast");
    expect(html).not.toContain("Bad Rating Roast");

    const elizabethIndex = html.indexOf("Elizabeth line");
    const jubileeIndex = html.indexOf("Jubilee line");
    expect(elizabethIndex).toBeLessThan(jubileeIndex);

    expect(html).toContain('href="/tube-stations-with-roast-dinner-reviews"');
  });
});
