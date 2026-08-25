import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "../types";
import { fetchGraphQL } from "./api";
import { getYearlyStatsPosts, resetYearlyStatsPostsCache } from "./getYearlyStatsPosts";
import GET_YEARLY_STATS_POSTS from "./queries/getYearlyStatsPosts";

vi.mock("./api", () => ({
  fetchGraphQL: vi.fn(),
}));

const mockFetchGraphQL = fetchGraphQL as unknown as Mock;

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    date: "2024-01-01",
    slug: "test-slug",
    title: "Test Post",
    ...overrides,
  } as Post;
}

function makeResponse(posts: Post[], hasNextPage: boolean, endCursor: string | null) {
  return {
    posts: {
      nodes: posts,
      pageInfo: { hasNextPage, endCursor },
    },
  };
}

describe("getYearlyStatsPosts", () => {
  beforeEach(() => {
    mockFetchGraphQL.mockReset();
    resetYearlyStatsPostsCache();
  });

  afterEach(() => {
    resetYearlyStatsPostsCache();
  });

  it("fetches all posts from a single page and calls fetchGraphQL with the correct query and empty variables", async () => {
    const posts = [makePost({ slug: "a" }), makePost({ slug: "b" })];
    mockFetchGraphQL.mockResolvedValueOnce(makeResponse(posts, false, null));

    const result = await getYearlyStatsPosts();

    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("a");
    expect(result[1].slug).toBe("b");
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(1);
    expect(mockFetchGraphQL).toHaveBeenCalledWith(GET_YEARLY_STATS_POSTS, {});
  });

  it("paginates through two pages, passing the cursor from the first page on the second call", async () => {
    mockFetchGraphQL
      .mockResolvedValueOnce(makeResponse([makePost({ slug: "page1" })], true, "cursor-1"))
      .mockResolvedValueOnce(makeResponse([makePost({ slug: "page2" })], false, null));

    const result = await getYearlyStatsPosts();

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.slug)).toEqual(["page1", "page2"]);
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(2);
    expect(mockFetchGraphQL).toHaveBeenNthCalledWith(1, GET_YEARLY_STATS_POSTS, {});
    expect(mockFetchGraphQL).toHaveBeenNthCalledWith(2, GET_YEARLY_STATS_POSTS, { after: "cursor-1" });
  });

  it("returns the cached promise on a second call without firing an additional fetch", async () => {
    const posts = [makePost({ slug: "cached" })];
    mockFetchGraphQL.mockResolvedValueOnce(makeResponse(posts, false, null));

    const [result1, result2] = await Promise.all([getYearlyStatsPosts(), getYearlyStatsPosts()]);

    expect(result1).toBe(result2);
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(1);
  });

  it("resets the cache after a failed fetch so the next call retries instead of re-throwing the same promise", async () => {
    mockFetchGraphQL.mockRejectedValueOnce(new Error("Network failure"));

    await expect(getYearlyStatsPosts()).rejects.toThrow("Network failure");

    const posts = [makePost({ slug: "retry" })];
    mockFetchGraphQL.mockResolvedValueOnce(makeResponse(posts, false, null));

    const result = await getYearlyStatsPosts();

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("retry");
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(2);
  });

  it("returns an empty array when the API returns no posts", async () => {
    mockFetchGraphQL.mockResolvedValueOnce(makeResponse([], false, null));

    const result = await getYearlyStatsPosts();

    expect(result).toEqual([]);
  });
});
