import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "../types";
import { fetchGraphQL } from "./api";
import { getAllRoastDinnerPosts } from "./getAllRoastDinnerPosts";
import GET_ALL_POSTS from "./queries/getAllPosts";

vi.mock("./api", () => ({
  fetchGraphQL: vi.fn()
}));

const mockFetchGraphQL = fetchGraphQL as unknown as Mock;

describe("getAllRoastDinnerPosts", () => {
  beforeEach(() => {
    mockFetchGraphQL.mockReset();
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
});
