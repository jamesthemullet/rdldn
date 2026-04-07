import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "../types";
import { fetchGraphQL } from "./api";
import {
  fetchPageData,
  fetchPostsByDate,
  fetchTopRatedRoasts,
  fetchTopRatedRoastsByFilter,
} from "./graphql";
import GET_ALL_POSTS from "./queries/getAllPosts";
import GET_POSTS_BY_DATE from "./queries/getPostsByDate";
import SINGLE_PAGE_QUERY_PREVIEW from "./queries/singlePage";

vi.mock("./api", () => ({
  fetchGraphQL: vi.fn(),
}));

const mockFetchGraphQL = fetchGraphQL as unknown as Mock;

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    date: "2024-01-01",
    slug: "test-slug",
    title: "Test Post",
    ratings: { nodes: [{ name: "7" }] },
    areas: { nodes: [{ name: "North London" }] },
    closedDowns: { nodes: [] },
    ...overrides,
  } as Post;
}

function singlePage(posts: Post[], hasNextPage = false, endCursor: string | null = null) {
  return {
    posts: {
      nodes: posts,
      pageInfo: { hasNextPage, endCursor },
    },
  };
}

describe("fetchTopRatedRoastsByFilter", () => {
  beforeEach(() => {
    mockFetchGraphQL.mockReset();
  });

  it("returns posts matching the matcher, sorted by rating descending", async () => {
    const low = makePost({ slug: "low", ratings: { nodes: [{ name: "6" }] } });
    const high = makePost({ slug: "high", ratings: { nodes: [{ name: "9" }] } });

    mockFetchGraphQL.mockResolvedValueOnce(singlePage([low, high]));

    const result = await fetchTopRatedRoastsByFilter({
      matcher: () => true,
    });

    expect(result[0].slug).toBe("high");
    expect(result[1].slug).toBe("low");
  });

  it("respects the limit parameter", async () => {
    const posts = Array.from({ length: 10 }, (_, i) =>
      makePost({ slug: `slug-${i}`, ratings: { nodes: [{ name: String(i + 1) }] } })
    );

    mockFetchGraphQL.mockResolvedValueOnce(singlePage(posts));

    const result = await fetchTopRatedRoastsByFilter({ matcher: () => true, limit: 3 });

    expect(result).toHaveLength(3);
  });

  it("uses a default limit of 5", async () => {
    const posts = Array.from({ length: 8 }, (_, i) =>
      makePost({ slug: `slug-${i}`, ratings: { nodes: [{ name: String(i + 1) }] } })
    );

    mockFetchGraphQL.mockResolvedValueOnce(singlePage(posts));

    const result = await fetchTopRatedRoastsByFilter({ matcher: () => true });

    expect(result).toHaveLength(5);
  });

  it("excludes posts where matcher returns false", async () => {
    const matching = makePost({ slug: "matching", areas: { nodes: [{ name: "East" }] } });
    const nonMatching = makePost({ slug: "other", areas: { nodes: [{ name: "West" }] } });

    mockFetchGraphQL.mockResolvedValueOnce(singlePage([matching, nonMatching]));

    const result = await fetchTopRatedRoastsByFilter({
      matcher: (post) => post.areas?.nodes?.[0]?.name === "East",
    });

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("matching");
  });

  it("excludes closed posts", async () => {
    const open = makePost({ slug: "open", closedDowns: { nodes: [] } });
    const closed = makePost({
      slug: "closed",
      closedDowns: { nodes: [{ name: "closed" }] },
    });

    mockFetchGraphQL.mockResolvedValueOnce(singlePage([open, closed]));

    const result = await fetchTopRatedRoastsByFilter({ matcher: () => true });

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("open");
  });

  it("excludes posts with no rating (defaults to 0, not above minRating 0)", async () => {
    const noRating = makePost({ slug: "no-rating", ratings: { nodes: [] } });
    const hasRating = makePost({ slug: "has-rating", ratings: { nodes: [{ name: "7" }] } });

    mockFetchGraphQL.mockResolvedValueOnce(singlePage([noRating, hasRating]));

    const result = await fetchTopRatedRoastsByFilter({ matcher: () => true, minRating: 0 });

    // rating 0 is not > 0, so excluded
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("has-rating");
  });

  it("respects minRating threshold", async () => {
    const low = makePost({ slug: "low", ratings: { nodes: [{ name: "5" }] } });
    const high = makePost({ slug: "high", ratings: { nodes: [{ name: "9" }] } });

    mockFetchGraphQL.mockResolvedValueOnce(singlePage([low, high]));

    const result = await fetchTopRatedRoastsByFilter({ matcher: () => true, minRating: 7 });

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("high");
  });

  it("paginates through multiple pages", async () => {
    const firstPost = makePost({ slug: "first", ratings: { nodes: [{ name: "8" }] } });
    const secondPost = makePost({ slug: "second", ratings: { nodes: [{ name: "9" }] } });

    mockFetchGraphQL
      .mockResolvedValueOnce(singlePage([firstPost], true, "cursor-1"))
      .mockResolvedValueOnce(singlePage([secondPost], false, null));

    const result = await fetchTopRatedRoastsByFilter({ matcher: () => true });

    expect(mockFetchGraphQL).toHaveBeenCalledTimes(2);
    expect(mockFetchGraphQL).toHaveBeenNthCalledWith(1, GET_ALL_POSTS, {});
    expect(mockFetchGraphQL).toHaveBeenNthCalledWith(2, GET_ALL_POSTS, { after: "cursor-1" });
    expect(result).toHaveLength(2);
  });
});

describe("fetchTopRatedRoasts", () => {
  beforeEach(() => {
    mockFetchGraphQL.mockReset();
  });

  it("returns top 5 posts as topRated", async () => {
    const posts = Array.from({ length: 7 }, (_, i) =>
      makePost({
        slug: `slug-${i}`,
        title: `Post ${i}`,
        ratings: { nodes: [{ name: String(9 - i) }] },
        areas: { nodes: [{ name: "South London" }] },
      })
    );

    mockFetchGraphQL.mockResolvedValueOnce(singlePage(posts));

    const { topRated } = await fetchTopRatedRoasts("South London");

    expect(topRated).toHaveLength(5);
  });

  it("only includes posts matching the given area", async () => {
    const inArea = makePost({
      slug: "in-area",
      areas: { nodes: [{ name: "East London" }] },
      ratings: { nodes: [{ name: "8" }] },
    });
    const outArea = makePost({
      slug: "out-area",
      areas: { nodes: [{ name: "West London" }] },
      ratings: { nodes: [{ name: "8" }] },
    });

    mockFetchGraphQL.mockResolvedValueOnce(singlePage([inArea, outArea]));

    const { topRated } = await fetchTopRatedRoasts("East London");

    expect(topRated).toHaveLength(1);
    expect(topRated[0].slug).toBe("in-area");
  });

  it("returns highRated posts with rating >= 8 not already in topRated", async () => {
    // 5 posts rated 9 will go to topRated; 1 post rated 8 becomes highRated
    const topPosts = Array.from({ length: 5 }, (_, i) =>
      makePost({
        slug: `top-${i}`,
        title: `Top ${i}`,
        ratings: { nodes: [{ name: "9" }] },
        areas: { nodes: [{ name: "Central" }] },
      })
    );
    const highPost = makePost({
      slug: "high-rated",
      title: "High Rated",
      ratings: { nodes: [{ name: "8.5" }] },
      areas: { nodes: [{ name: "Central" }] },
    });

    mockFetchGraphQL.mockResolvedValueOnce(singlePage([...topPosts, highPost]));

    const { topRated, highRated } = await fetchTopRatedRoasts("Central");

    expect(topRated).toHaveLength(5);
    expect(highRated).toHaveLength(1);
    expect(highRated[0].slug).toBe("high-rated");
    expect(highRated[0].name).toBe("High Rated");
    expect(highRated[0].rating).toBe("8.50");
  });

  it("excludes posts rated below 8 from highRated", async () => {
    const topPosts = Array.from({ length: 5 }, (_, i) =>
      makePost({
        slug: `top-${i}`,
        ratings: { nodes: [{ name: "9" }] },
        areas: { nodes: [{ name: "Central" }] },
      })
    );
    const lowish = makePost({
      slug: "low-rated",
      ratings: { nodes: [{ name: "7.5" }] },
      areas: { nodes: [{ name: "Central" }] },
    });

    mockFetchGraphQL.mockResolvedValueOnce(singlePage([...topPosts, lowish]));

    const { highRated } = await fetchTopRatedRoasts("Central");

    expect(highRated).toHaveLength(0);
  });

  it("uses empty string for title and slug when missing", async () => {
    const topPosts = Array.from({ length: 5 }, (_, i) =>
      makePost({
        slug: `top-${i}`,
        ratings: { nodes: [{ name: "9" }] },
        areas: { nodes: [{ name: "Central" }] },
      })
    );
    const noMeta = {
      date: "2024-01-01",
      ratings: { nodes: [{ name: "8" }] },
      areas: { nodes: [{ name: "Central" }] },
      closedDowns: { nodes: [] },
    } as Post;

    mockFetchGraphQL.mockResolvedValueOnce(singlePage([...topPosts, noMeta]));

    const { highRated } = await fetchTopRatedRoasts("Central");

    expect(highRated[0].name).toBe("");
    expect(highRated[0].slug).toBe("");
  });
});

describe("fetchPageData", () => {
  beforeEach(() => {
    mockFetchGraphQL.mockReset();
  });

  it("returns page data when the API responds with a page", async () => {
    const page = { id: "cG9zdDoxMDYw", title: "About" };

    mockFetchGraphQL.mockResolvedValueOnce({ page });

    const result = await fetchPageData("10608");

    expect(result).toBe(page);
    expect(mockFetchGraphQL).toHaveBeenCalledWith(SINGLE_PAGE_QUERY_PREVIEW, {
      id: "10608",
    });
  });

  it("logs and throws when page is null", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    mockFetchGraphQL.mockResolvedValueOnce({ page: null });

    await expect(fetchPageData("10608")).rejects.toThrow("No single page data found");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching GraphQL data:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it("logs and re-throws when the API request fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const networkError = new Error("Network error");

    mockFetchGraphQL.mockRejectedValueOnce(networkError);

    await expect(fetchPageData("10608")).rejects.toThrow("Network error");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching GraphQL data:",
      networkError
    );

    consoleErrorSpy.mockRestore();
  });
});

describe("fetchPostsByDate", () => {
  beforeEach(() => {
    mockFetchGraphQL.mockReset();
  });

  it("returns posts nodes for a given date string", async () => {
    const posts = [makePost({ slug: "january" })];

    mockFetchGraphQL.mockResolvedValueOnce({ posts: { nodes: posts } });

    const result = await fetchPostsByDate("2024-01");

    expect(result).toEqual(posts);
    expect(mockFetchGraphQL).toHaveBeenCalledWith(GET_POSTS_BY_DATE, {
      year: 2024,
      month: 1,
    });
  });

  it("parses year and month as integers from the date string", async () => {
    mockFetchGraphQL.mockResolvedValueOnce({ posts: { nodes: [] } });

    await fetchPostsByDate("2023-12");

    expect(mockFetchGraphQL).toHaveBeenCalledWith(GET_POSTS_BY_DATE, {
      year: 2023,
      month: 12,
    });
  });

  it("throws when the API returns a falsy response", async () => {
    mockFetchGraphQL.mockResolvedValueOnce(null);

    await expect(fetchPostsByDate("2024-01")).rejects.toThrow(
      "Failed to fetch posts by date"
    );
  });

  it("throws when the API response has no posts property", async () => {
    mockFetchGraphQL.mockResolvedValueOnce({});

    await expect(fetchPostsByDate("2024-01")).rejects.toThrow(
      "Failed to fetch posts by date"
    );
  });
});
