import { beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("./api", () => ({
  fetchGraphQL: fetchGraphQLMock,
}));

const createFeaturedImageNode = (homepageUrl: string, sourceUrl: string = homepageUrl) => ({
  node: {
    sourceUrl,
    mediaDetails: {
      sizes: [{ name: "homepage", sourceUrl: homepageUrl }],
    },
  },
});

const getDefaultResponseByQuery = (query: string, variables: Record<string, unknown> = {}) => {
  if (query.includes('where: {tag: "best"}')) {
    return {
      posts: {
        nodes: [
          {
            slug: "best-roast",
            title: "Best Roast",
            featuredImage: createFeaturedImageNode("https://example.com/best-homepage.jpg"),
            ratings: { nodes: [{ name: "9.1" }] },
            yearsOfVisit: { nodes: [{ name: "2025" }] },
          },
        ],
      },
    };
  }

  if (query.includes("pages(first: 100)")) {
    return {
      pages: {
        nodes: [
          {
            id: "feature-page-1",
            slug: "feature-page-1",
            title: "Feature Page 1",
            highlights: { tag: "feature" },
            featuredImage: createFeaturedImageNode("https://example.com/feature-page-1.jpg"),
          },
          {
            id: "roastatistics-page-1",
            slug: "roastatistics-page-1",
            title: "Roastatistics Page 1",
            highlights: { tag: "roastatistics" },
            featuredImage: createFeaturedImageNode("https://example.com/roastatistics-page-1.jpg"),
          },
        ],
      },
    };
  }

  if (query.includes('where: {tag: "feature"}')) {
    return {
      posts: {
        edges: [
          {
            node: {
              slug: "feature-post-1",
              title: "Feature Post 1",
              featuredImage: createFeaturedImageNode("https://example.com/feature-post-1.jpg"),
            },
          },
        ],
      },
    };
  }

  if (query.includes("query SinglePage($id: ID!)")) {
    const id = String(variables.id ?? "");
    return {
      page: {
        pageId: id,
        slug: `page-${id}`,
        title: `Page ${id}`,
        featuredImage: createFeaturedImageNode(`https://example.com/page-${id}-homepage.jpg`),
      },
    };
  }

  throw new Error(`Unhandled query in test mock: ${query.slice(0, 60)}`);
};

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

describe("getHomepageHighlights", () => {
  test("returns best roasts, features, and roastatistics from GraphQL data", async () => {
    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) =>
        getDefaultResponseByQuery(query, variables)
    );

    const { getHomepageHighlights } = await import("./homepage-highlights");
    const data = await getHomepageHighlights();

    expect(data.bestRoasts).toEqual([
      {
        slug: "best-roast",
        title: "Best Roast",
        featuredImageUrl: "https://example.com/best-homepage.jpg",
        rating: "9.1",
        yearVisited: "2025",
      },
    ]);

    expect(data.features.map((item) => item.slug)).toEqual(
      expect.arrayContaining(["feature-page-1", "feature-post-1"])
    );

    expect(data.roastStatistics[0]).toEqual({
      slug: "page-4102",
      title: "Page 4102",
      featuredImageUrl: "https://example.com/page-4102-homepage.jpg",
    });
    expect(data.roastStatistics.map((item) => item.slug)).toContain("roastatistics-page-1");
  });

  test("logs and continues when fetching best roasts fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes('where: {tag: "best"}')) {
          throw new Error("Best roasts request failed");
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const { getHomepageHighlights } = await import("./homepage-highlights");
    const data = await getHomepageHighlights();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching best roasts:",
      expect.any(Error)
    );
    expect(data.bestRoasts).toEqual([]);
  });

  test("logs and continues when the all-pages query fails, but feature posts still load", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("pages(first: 100)")) {
          throw new Error("All pages request failed");
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const { getHomepageHighlights } = await import("./homepage-highlights");
    const data = await getHomepageHighlights();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching features data:",
      expect.any(Error)
    );
    expect(data.features.map((item) => item.slug)).toEqual(["feature-post-1"]);
    expect(data.roastStatistics.map((item) => item.slug)).toEqual(["page-4102"]);
  });

  test("logs and continues when the roastatistics single-page fetch fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("query SinglePage($id: ID!)") && variables.id === "4102") {
          throw new Error("Roastatistics featured page failed");
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const { getHomepageHighlights } = await import("./homepage-highlights");
    const data = await getHomepageHighlights();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching features data:",
      expect.any(Error)
    );
    expect(data.roastStatistics.map((item) => item.slug)).toEqual(["roastatistics-page-1"]);
  });

  test("sanitizes titles containing HTML", async () => {
    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes('where: {tag: "best"}')) {
          return {
            posts: {
              nodes: [
                {
                  slug: "best-roast",
                  title: "<strong>Best</strong> Roast &amp; Chips",
                  featuredImage: createFeaturedImageNode("https://example.com/best-homepage.jpg"),
                  ratings: { nodes: [{ name: "9.1" }] },
                  yearsOfVisit: { nodes: [{ name: "2025" }] },
                },
              ],
            },
          };
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const { getHomepageHighlights } = await import("./homepage-highlights");
    const data = await getHomepageHighlights();

    expect(data.bestRoasts[0].title).not.toContain("<strong>");
  });
});
