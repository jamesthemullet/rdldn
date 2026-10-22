import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "../types";
import { fetchGraphQL } from "./api";
import {
  getAllRoastDinnerPosts,
  resetGetAllRoastDinnerPostsCache
} from "./getAllRoastDinnerPosts";
import { kv } from "./kv";
import GET_ALL_POSTS from "./queries/getAllPosts";

vi.mock("./api", () => ({
  fetchGraphQL: vi.fn()
}));

vi.mock("./kv", () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn()
  }
}));

const mockFetchGraphQL = fetchGraphQL as unknown as Mock;
const mockKvGet = kv.get as unknown as Mock;
const mockKvSet = kv.set as unknown as Mock;

describe("getAllRoastDinnerPosts", () => {
  beforeEach(() => {
    mockFetchGraphQL.mockReset();
    mockKvGet.mockReset().mockResolvedValue(null);
    mockKvSet.mockReset().mockResolvedValue(undefined);
    resetGetAllRoastDinnerPostsCache();
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

    const result = await getAllRoastDinnerPosts();

    expect(result).toEqual([firstPagePost, secondPagePost]);
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(2);
    expect(mockFetchGraphQL).toHaveBeenNthCalledWith(1, GET_ALL_POSTS, {});
    expect(mockFetchGraphQL).toHaveBeenNthCalledWith(2, GET_ALL_POSTS, { after: "cursor-1" });
  });

  it("returns an empty list when the API response is missing posts", async () => {
    mockFetchGraphQL.mockResolvedValueOnce({ posts: undefined });

    const result = await getAllRoastDinnerPosts();

    expect(result).toEqual([]);
    expect(mockFetchGraphQL).toHaveBeenCalledWith(GET_ALL_POSTS, {});
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
      getAllRoastDinnerPosts(),
      getAllRoastDinnerPosts()
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

    await expect(getAllRoastDinnerPosts()).rejects.toThrow("Network error");

    const result = await getAllRoastDinnerPosts();

    expect(result).toEqual([recoveryPost]);
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(2);
  });

  it("returns the cached posts from KV without hitting the network", async () => {
    const cachedPost: Post = {
      slug: "cached",
      date: "2024-04-01",
      ratings: { nodes: [{ name: "8" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] }
    } as Post;
    mockKvGet.mockResolvedValue([cachedPost]);

    const result = await getAllRoastDinnerPosts();

    expect(result).toEqual([cachedPost]);
    expect(mockFetchGraphQL).not.toHaveBeenCalled();
  });

  it("caches a fresh fetch in KV on a cache miss", async () => {
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

    const result = await getAllRoastDinnerPosts();

    expect(result).toEqual([firstPagePost]);
    expect(mockKvSet).toHaveBeenCalledWith(
      "all-roast-dinner-posts",
      [firstPagePost],
      { ex: 5 * 60 }
    );
  });

  it("falls back to a network fetch when the KV lookup fails", async () => {
    const firstPagePost: Post = {
      slug: "first",
      date: "2024-01-01",
      ratings: { nodes: [{ name: "8" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] }
    } as Post;
    mockKvGet.mockRejectedValue(new Error("KV connection failed"));
    mockFetchGraphQL.mockResolvedValueOnce({
      posts: {
        nodes: [firstPagePost],
        pageInfo: { hasNextPage: false, endCursor: null }
      }
    });

    const result = await getAllRoastDinnerPosts();

    expect(result).toEqual([firstPagePost]);
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(1);
  });

  it("still returns the fetched posts when writing to KV fails", async () => {
    const firstPagePost: Post = {
      slug: "first",
      date: "2024-01-01",
      ratings: { nodes: [{ name: "8" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] }
    } as Post;
    mockKvSet.mockRejectedValue(new Error("KV connection failed"));
    mockFetchGraphQL.mockResolvedValueOnce({
      posts: {
        nodes: [firstPagePost],
        pageInfo: { hasNextPage: false, endCursor: null }
      }
    });

    const result = await getAllRoastDinnerPosts();

    expect(result).toEqual([firstPagePost]);
  });
});
