import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "../types";
import { fetchGraphQL } from "./api";
import { getYearlyStatsPosts, resetYearlyStatsPostsCache } from "./getYearlyStatsPosts";
import GET_YEARLY_STATS_POSTS from "./queries/getYearlyStatsPosts";

vi.mock("./api", () => ({
  fetchGraphQL: vi.fn()
}));

const mockFetchGraphQL = fetchGraphQL as unknown as Mock;

describe("getYearlyStatsPosts", () => {
  beforeEach(() => {
    mockFetchGraphQL.mockReset();
    resetYearlyStatsPostsCache();
  });

  it("paginates through all posts until there are no more pages", async () => {
    const firstPagePost: Post = {
      slug: "first",
      date: "2024-01-01",
      ratings: { nodes: [{ name: "8" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] }
    } as Post;

    const secondPagePost: Post = {
      slug: "second",
      date: "2024-02-01",
      ratings: { nodes: [{ name: "8" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] }
    } as Post;

    mockFetchGraphQL
      .mockResolvedValueOnce({
        posts: {
          nodes: [firstPagePost],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" }
        }
      })
      .mockResolvedValueOnce({
        posts: {
          nodes: [secondPagePost],
          pageInfo: { hasNextPage: false, endCursor: null }
        }
      });

    const result = await getYearlyStatsPosts();

    expect(result).toEqual([firstPagePost, secondPagePost]);
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(2);
    expect(mockFetchGraphQL).toHaveBeenNthCalledWith(1, GET_YEARLY_STATS_POSTS, {});
    expect(mockFetchGraphQL).toHaveBeenNthCalledWith(2, GET_YEARLY_STATS_POSTS, { after: "cursor-1" });
  });

  it("returns an empty list when the API response is missing posts", async () => {
    mockFetchGraphQL.mockResolvedValueOnce({ posts: undefined });

    const result = await getYearlyStatsPosts();

    expect(result).toEqual([]);
    expect(mockFetchGraphQL).toHaveBeenCalledWith(GET_YEARLY_STATS_POSTS, {});
  });

  it("reuses one shared Promise across repeated calls", async () => {
    const firstPagePost: Post = {
      slug: "first",
      date: "2024-01-01",
      ratings: { nodes: [{ name: "8" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] }
    } as Post;

    mockFetchGraphQL.mockResolvedValueOnce({
      posts: {
        nodes: [firstPagePost],
        pageInfo: { hasNextPage: false, endCursor: null }
      }
    });

    const [firstResult, secondResult] = await Promise.all([
      getYearlyStatsPosts(),
      getYearlyStatsPosts()
    ]);

    expect(firstResult).toEqual([firstPagePost]);
    expect(secondResult).toEqual([firstPagePost]);
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(1);
  });

  it("clears the cache on fetch failure so subsequent calls can retry", async () => {
    const networkError = new Error("Network error");
    const recoveryPost: Post = {
      slug: "recovery",
      date: "2024-03-01",
      ratings: { nodes: [{ name: "8" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] }
    } as Post;

    mockFetchGraphQL
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce({
        posts: {
          nodes: [recoveryPost],
          pageInfo: { hasNextPage: false, endCursor: null }
        }
      });

    await expect(getYearlyStatsPosts()).rejects.toThrow("Network error");

    const result = await getYearlyStatsPosts();

    expect(result).toEqual([recoveryPost]);
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(2);
  });
});
