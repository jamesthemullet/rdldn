import { describe, expect, it, vi } from "vitest";
import type { Post } from "../types";
import { buildYearlyRoastStats, fetchAllPosts } from "./yearlyRoastStats";

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    date: "2024-01-01",
    slug: "test-slug",
    title: "Test Post",
    typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
    ratings: { nodes: [{ name: "7" }] },
    yearsOfVisit: { nodes: [{ name: "2024" }] },
    ...overrides,
  } as Post;
}

function makeFetchGraphQL(pages: Array<{ posts: Post[]; hasNextPage: boolean; endCursor: string | null }>) {
  const mock = vi.fn();
  for (const page of pages) {
    mock.mockResolvedValueOnce({
      posts: {
        nodes: page.posts,
        pageInfo: { hasNextPage: page.hasNextPage, endCursor: page.endCursor },
      },
    });
  }
  return mock;
}

describe("fetchAllPosts", () => {
  it("returns all posts from a single page", async () => {
    const posts = [makePost({ slug: "a" }), makePost({ slug: "b" })];
    const fetch = makeFetchGraphQL([{ posts, hasNextPage: false, endCursor: null }]);

    const result = await fetchAllPosts(fetch, "GET_ALL_POSTS");

    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("a");
    expect(result[1].slug).toBe("b");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("GET_ALL_POSTS", {});
  });

  it("paginates through multiple pages", async () => {
    const fetch = makeFetchGraphQL([
      { posts: [makePost({ slug: "page1" })], hasNextPage: true, endCursor: "cursor-1" },
      { posts: [makePost({ slug: "page2" })], hasNextPage: false, endCursor: null },
    ]);

    const result = await fetchAllPosts(fetch, "GET_ALL_POSTS");

    expect(result).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, "GET_ALL_POSTS", {});
    expect(fetch).toHaveBeenNthCalledWith(2, "GET_ALL_POSTS", { after: "cursor-1" });
  });

  it("returns an empty array when there are no posts", async () => {
    const fetch = makeFetchGraphQL([{ posts: [], hasNextPage: false, endCursor: null }]);

    const result = await fetchAllPosts(fetch, "GET_ALL_POSTS");

    expect(result).toEqual([]);
  });

  it("accumulates posts across three pages", async () => {
    const fetch = makeFetchGraphQL([
      { posts: [makePost({ slug: "a" })], hasNextPage: true, endCursor: "c1" },
      { posts: [makePost({ slug: "b" })], hasNextPage: true, endCursor: "c2" },
      { posts: [makePost({ slug: "c" })], hasNextPage: false, endCursor: null },
    ]);

    const result = await fetchAllPosts(fetch, "GET_ALL_POSTS");

    expect(result.map((p) => p.slug)).toEqual(["a", "b", "c"]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

describe("buildYearlyRoastStats", () => {
  it("counts roast dinner posts grouped by year", () => {
    const posts = [
      makePost({ yearsOfVisit: { nodes: [{ name: "2023" }] } }),
      makePost({ yearsOfVisit: { nodes: [{ name: "2024" }] } }),
      makePost({ yearsOfVisit: { nodes: [{ name: "2024" }] } }),
    ];

    const result = buildYearlyRoastStats(posts, () => false);

    expect(result["2023"]).toEqual({ matching: 0, total: 1 });
    expect(result["2024"]).toEqual({ matching: 0, total: 2 });
  });

  it("increments matching count when isMatchingRating returns true", () => {
    const posts = [
      makePost({ ratings: { nodes: [{ name: "8" }] }, yearsOfVisit: { nodes: [{ name: "2024" }] } }),
      makePost({ ratings: { nodes: [{ name: "6" }] }, yearsOfVisit: { nodes: [{ name: "2024" }] } }),
    ];

    const result = buildYearlyRoastStats(posts, (rating) => rating >= 8);

    expect(result["2024"]).toEqual({ matching: 1, total: 2 });
  });

  it("ignores posts that are not of type 'Roast Dinner'", () => {
    const posts = [
      makePost({ typesOfPost: { nodes: [{ name: "Pub Review" }] } }),
      makePost({ typesOfPost: { nodes: [{ name: "Roast Dinner" }] } }),
    ];

    const result = buildYearlyRoastStats(posts, () => true);

    expect(Object.keys(result)).toEqual(["2024"]);
    expect(result["2024"].total).toBe(1);
  });

  it("ignores posts without a yearsOfVisit entry", () => {
    const posts = [
      makePost({ yearsOfVisit: { nodes: [] } }),
      makePost({ yearsOfVisit: { nodes: [{ name: "2024" }] } }),
    ];

    const result = buildYearlyRoastStats(posts, () => true);

    expect(Object.keys(result)).toEqual(["2024"]);
    expect(result["2024"].total).toBe(1);
  });

  it("does not increment matching when the rating is NaN", () => {
    const posts = [
      makePost({ ratings: { nodes: [] }, yearsOfVisit: { nodes: [{ name: "2024" }] } }),
      makePost({ ratings: { nodes: [{ name: "not-a-number" }] }, yearsOfVisit: { nodes: [{ name: "2024" }] } }),
    ];

    const result = buildYearlyRoastStats(posts, () => true);

    expect(result["2024"]).toEqual({ matching: 0, total: 2 });
  });

  it("returns an empty object when given no posts", () => {
    const result = buildYearlyRoastStats([], () => true);

    expect(result).toEqual({});
  });

  it("supports a custom isMatchingRating predicate (e.g. rating >= 9)", () => {
    const posts = [
      makePost({ ratings: { nodes: [{ name: "9.5" }] }, yearsOfVisit: { nodes: [{ name: "2024" }] } }),
      makePost({ ratings: { nodes: [{ name: "8" }] }, yearsOfVisit: { nodes: [{ name: "2024" }] } }),
      makePost({ ratings: { nodes: [{ name: "9" }] }, yearsOfVisit: { nodes: [{ name: "2024" }] } }),
    ];

    const result = buildYearlyRoastStats(posts, (rating) => rating >= 9);

    expect(result["2024"]).toEqual({ matching: 2, total: 3 });
  });
});
