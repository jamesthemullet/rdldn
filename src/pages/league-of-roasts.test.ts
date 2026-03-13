import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();
const getSinglePageDataMock = vi.fn();

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock,
}));

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: getSinglePageDataMock,
}));

vi.mock("../components/sort-posts/sort-posts.tsx", () => ({
  default: (() => {
    const SortPostsComponent = () =>
      '<div class="sort-posts-mock">Sort posts component</div>';
    (SortPostsComponent as any).isAstroComponentFactory = true;
    return SortPostsComponent;
  })(),
}));

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })(),
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  getSinglePageDataMock.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("league-of-roasts page", () => {
  test("fetches paginated posts, filters roast dinners, and builds structured data from open posts", async () => {
    getSinglePageDataMock.mockResolvedValue({
      pageId: "267",
      title: "League of Roasts",
      content: "<p>League intro</p>",
      comments: { nodes: [] },
      seo: {
        opengraphDescription: "Best roast dinners in London.",
        opengraphImage: { sourceUrl: "https://example.com/league-og.jpg" },
      },
      featuredImage: { node: { sourceUrl: "https://example.com/league.jpg" } },
    });

    fetchGraphQLMock.mockImplementation(
      async (_query: string, variables: Record<string, unknown> = {}) => {
        if (!variables.after) {
          return {
            posts: {
              nodes: [
                {
                  title: "Top Open Roast",
                  slug: "top-open-roast",
                  typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
                  ratings: { nodes: [{ name: "9.7" }] },
                  closedDowns: { nodes: [] },
                },
                {
                  title: "Not A Roast",
                  slug: "not-a-roast",
                  typesOfPost: { nodes: [{ name: "Guide" }] },
                  ratings: { nodes: [{ name: "10" }] },
                  closedDowns: { nodes: [] },
                },
              ],
              pageInfo: {
                hasNextPage: true,
                endCursor: "cursor-1",
              },
            },
          };
        }

        return {
          posts: {
            nodes: [
              {
                title: "Closed Roast",
                slug: "closed-roast",
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
                ratings: { nodes: [{ name: "9.9" }] },
                closedDowns: { nodes: [{ name: "closeddown" }] },
              },
              {
                title: "Second Open Roast",
                slug: "second-open-roast",
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
                ratings: { nodes: [{ name: "8.3" }] },
                closedDowns: { nodes: [] },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        };
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./league-of-roasts.astro");
    const html = await container.renderToString(Page);

    expect(getSinglePageDataMock).toHaveBeenCalledWith({ variables: { id: "267" } });
    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("League of Roasts");
    expect(html).toContain("League intro");
    expect(html).toContain("Loading the league of roasts...");
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");

    expect(html).toContain('"@type":"ItemList"');
    expect(html).toContain('"name":"Top Open Roast"');
    expect(html).toContain('"name":"Second Open Roast"');
    expect(html).not.toContain('"name":"Closed Roast"');
    expect(html).not.toContain('"name":"Not A Roast"');
  });

  test("uses logo fallback when single page featured image is missing", async () => {
    getSinglePageDataMock.mockResolvedValue({
      pageId: "267",
      title: "League of Roasts",
      content: "<p>League intro</p>",
      comments: { nodes: [] },
      seo: {
        opengraphDescription: "Best roast dinners in London.",
        opengraphImage: { sourceUrl: "https://example.com/league-og.jpg" },
      },
      featuredImage: null,
    });

    fetchGraphQLMock.mockResolvedValue({
      posts: {
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./league-of-roasts.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("League of Roasts");
    expect(html).toContain('class="image-container"');
    expect(html).not.toContain("https://example.com/league.jpg");
  });

  test("treats missing/invalid ratings as 0 and keeps equal ratings stable", async () => {
    getSinglePageDataMock.mockResolvedValue({
      pageId: "267",
      title: "League of Roasts",
      content: "<p>League intro</p>",
      comments: { nodes: [] },
      seo: {
        opengraphDescription: "Best roast dinners in London.",
        opengraphImage: { sourceUrl: "https://example.com/league-og.jpg" },
      },
      featuredImage: { node: { sourceUrl: "https://example.com/league.jpg" } },
    });

    fetchGraphQLMock.mockResolvedValue({
      posts: {
        nodes: [
          {
            title: "Zero Rating A",
            slug: "zero-rating-a",
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            ratings: { nodes: [] },
            closedDowns: { nodes: [] },
          },
          {
            title: "Top Rated",
            slug: "top-rated",
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            ratings: { nodes: [{ name: "9.0" }] },
            closedDowns: { nodes: [] },
          },
          {
            title: "Zero Rating B",
            slug: "zero-rating-b",
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            ratings: { nodes: [{ name: "not-a-number" }] },
            closedDowns: { nodes: [] },
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./league-of-roasts.astro");
    const html = await container.renderToString(Page);

    const topRatedIndex = html.indexOf('"name":"Top Rated"');
    const zeroAIndex = html.indexOf('"name":"Zero Rating A"');
    const zeroBIndex = html.indexOf('"name":"Zero Rating B"');

    expect(topRatedIndex).toBeGreaterThan(-1);
    expect(zeroAIndex).toBeGreaterThan(-1);
    expect(zeroBIndex).toBeGreaterThan(-1);
    expect(topRatedIndex).toBeLessThan(zeroAIndex);
    expect(zeroAIndex).toBeLessThan(zeroBIndex);
  });
});
