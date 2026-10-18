import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("./api", () => ({
  fetchGraphQL: fetchGraphQLMock,
}));

const { getHomepageData } = await import("./homepage");

const image = (homepageUrl: string | null, sourceUrl: string) => ({
  node: {
    sourceUrl,
    mediaDetails: {
      sizes: homepageUrl ? [{ name: "homepage", sourceUrl: homepageUrl }] : [{ name: "thumbnail", sourceUrl: "thumb.jpg" }],
    },
  },
});

const empty = (query: string) => {
  if (query.includes("HomepageLatestPosts")) return { posts: { nodes: [] } };
  if (query.includes("HomepagePages")) return {};
  if (query.includes("edges")) return { posts: { edges: [] } };
  if (query.includes("pages(first: 100)")) return { pages: { nodes: [] } };
  return { posts: { nodes: [] } };
};

beforeEach(() => {
  fetchGraphQLMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getHomepageData", () => {
  test("fetches all sections in parallel with five requests and one batched page query", async () => {
    fetchGraphQLMock.mockImplementation(async (query: string) => empty(query));

    await getHomepageData();

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(5);
    const pagesQuery = fetchGraphQLMock.mock.calls
      .map(([query]) => query as string)
      .find((query) => query.includes("HomepagePages"));
    for (const id of ["267", "631", "10368", "17", "5614", "5612", "5616", "5594", "4102"]) {
      expect(pagesQuery).toContain(`p${id}: page(idType: DATABASE_ID, id: "${id}")`);
    }
  });

  test("falls back to the full-size image when the homepage size is missing", async () => {
    fetchGraphQLMock.mockImplementation(async (query: string) => {
      if (query.includes("HomepageLatestPosts")) {
        return {
          posts: {
            nodes: [
              { slug: "a", title: "A", date: "2026-01-01", featuredImage: image(null, "full-a.jpg") },
              { slug: "b", title: "B", date: "2026-01-02", featuredImage: image("home-b.jpg", "full-b.jpg") },
            ],
          },
        };
      }
      return empty(query);
    });

    const { latestPosts } = await getHomepageData();

    expect(latestPosts.map((post) => post.featuredImageUrl)).toEqual(["full-a.jpg", "home-b.jpg"]);
  });

  test("keeps page order and skips pages that are missing", async () => {
    fetchGraphQLMock.mockImplementation(async (query: string) => {
      if (query.includes("HomepagePages")) {
        return {
          p267: { slug: "p-267", title: "267", featuredImage: image("267.jpg", "267.jpg") },
          p631: null,
          p17: { slug: "p-17", title: "17", featuredImage: image("17.jpg", "17.jpg") },
          p5612: { slug: "p-5612", title: "5612", featuredImage: null },
        };
      }
      return empty(query);
    });

    const { favouriteRoastPages, locationPages } = await getHomepageData();

    expect(favouriteRoastPages.map((page) => page.slug)).toEqual(["p-267", "p-17"]);
    expect(locationPages).toEqual([{ slug: "p-5612", title: "5612", featuredImageUrl: undefined }]);
  });

  test("pins the roastatistics page first and fills up to four from tagged pages", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    fetchGraphQLMock.mockImplementation(async (query: string) => {
      if (query.includes("HomepagePages")) {
        return { p4102: { slug: "roastatistics", title: "Roastatistics", featuredImage: null } };
      }
      if (query.includes("pages(first: 100)")) {
        return {
          pages: {
            nodes: ["roastatistics", "s1", "s2", "s3", "s4"].map((slug) => ({
              slug,
              title: slug,
              highlights: { tag: "roastatistics" },
            })),
          },
        };
      }
      return empty(query);
    });

    const { roastStatistics } = await getHomepageData();

    expect(roastStatistics).toHaveLength(4);
    expect(roastStatistics[0].slug).toBe("roastatistics");
    expect(roastStatistics.filter((card) => card.slug === "roastatistics")).toHaveLength(1);
  });

  test("limits best roasts and features to four and includes rating details", async () => {
    fetchGraphQLMock.mockImplementation(async (query: string) => {
      if (query.includes('tag: "best"')) {
        return {
          posts: {
            nodes: Array.from({ length: 6 }, (_, i) => ({
              slug: `best-${i}`,
              title: `Best ${i}`,
              ratings: { nodes: [{ name: "9" }] },
              yearsOfVisit: { nodes: [{ name: "2024" }] },
            })),
          },
        };
      }
      if (query.includes('tag: "feature"')) {
        return { posts: { edges: [1, 2, 3].map((i) => ({ node: { slug: `fp-${i}`, title: `FP ${i}` } })) } };
      }
      if (query.includes("pages(first: 100)")) {
        return { pages: { nodes: [1, 2].map((i) => ({ slug: `pg-${i}`, title: `PG ${i}`, highlights: { tag: "feature" } })) } };
      }
      return empty(query);
    });

    const { bestRoasts, features } = await getHomepageData();

    expect(bestRoasts).toHaveLength(4);
    expect(bestRoasts[0]).toMatchObject({ rating: "9", yearVisited: "2024" });
    expect(features).toHaveLength(4);
  });

  test("isolates failures so one broken query leaves the other sections intact", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchGraphQLMock.mockImplementation(async (query: string) => {
      if (query.includes("HomepagePages")) throw new Error("pages failed");
      if (query.includes("HomepageLatestPosts")) {
        return { posts: { nodes: [{ slug: "latest", title: "Latest", date: "2026-01-01" }] } };
      }
      return empty(query);
    });

    const data = await getHomepageData();

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching homepage pages:", expect.any(Error));
    expect(data.latestPosts).toHaveLength(1);
    expect(data.favouriteRoastPages).toEqual([]);
    expect(data.locationPages).toEqual([]);
  });

  test("sanitises titles and drops entries without a slug", async () => {
    fetchGraphQLMock.mockImplementation(async (query: string) => {
      if (query.includes("HomepageLatestPosts")) {
        return {
          posts: {
            nodes: [
              { slug: "x", title: "<script>alert(1)</script>Roast &amp; Gravy", date: "2026-01-01" },
              { title: "No slug", date: "2026-01-01" },
            ],
          },
        };
      }
      return empty(query);
    });

    const { latestPosts } = await getHomepageData();

    expect(latestPosts).toHaveLength(1);
    expect(latestPosts[0].title).not.toContain("<script>");
  });
});
