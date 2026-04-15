import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGraphQL } from "./api";
import { fetchAllSlugs } from "./fetchAllSlugs";

vi.mock("./api", () => ({
  fetchGraphQL: vi.fn(),
}));

const mockFetchGraphQL = fetchGraphQL as unknown as Mock;

const QUERY = "{ posts { nodes { slug } pageInfo { hasNextPage endCursor } } }";

function makeResponse(
  entity: "posts" | "pages",
  slugs: string[],
  hasNextPage = false,
  endCursor: string | null = null
) {
  return {
    [entity]: {
      nodes: slugs.map((slug) => ({ slug })),
      pageInfo: { hasNextPage, endCursor },
    },
  };
}

describe("fetchAllSlugs", () => {
  beforeEach(() => {
    mockFetchGraphQL.mockReset();
  });

  it("returns slugs from a single page", async () => {
    mockFetchGraphQL.mockResolvedValueOnce(makeResponse("posts", ["post-a", "post-b"]));

    const result = await fetchAllSlugs("posts", QUERY);

    expect(result).toEqual([{ slug: "post-a" }, { slug: "post-b" }]);
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(1);
    expect(mockFetchGraphQL).toHaveBeenCalledWith(QUERY, { first: 100, after: null });
  });

  it("paginates through multiple pages accumulating all slugs", async () => {
    mockFetchGraphQL
      .mockResolvedValueOnce(makeResponse("posts", ["page1-post"], true, "cursor-1"))
      .mockResolvedValueOnce(makeResponse("posts", ["page2-post"], false, null));

    const result = await fetchAllSlugs("posts", QUERY);

    expect(result).toEqual([{ slug: "page1-post" }, { slug: "page2-post" }]);
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(2);
    expect(mockFetchGraphQL).toHaveBeenNthCalledWith(1, QUERY, { first: 100, after: null });
    expect(mockFetchGraphQL).toHaveBeenNthCalledWith(2, QUERY, { first: 100, after: "cursor-1" });
  });

  it("works for the 'pages' entity type", async () => {
    mockFetchGraphQL.mockResolvedValueOnce(makeResponse("pages", ["about", "contact"]));

    const result = await fetchAllSlugs("pages", QUERY);

    expect(result).toEqual([{ slug: "about" }, { slug: "contact" }]);
  });

  it("returns an empty array when there are no items", async () => {
    mockFetchGraphQL.mockResolvedValueOnce(makeResponse("posts", []));

    const result = await fetchAllSlugs("posts", QUERY);

    expect(result).toEqual([]);
  });

  it("logs a warning and skips when nodes is not an array", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    mockFetchGraphQL.mockResolvedValueOnce({
      posts: {
        nodes: null,
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    });

    const result = await fetchAllSlugs("posts", QUERY);

    expect(result).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Warning: items is not an array",
      null,
      expect.anything()
    );

    consoleWarnSpy.mockRestore();
  });

  it("handles three pages correctly", async () => {
    mockFetchGraphQL
      .mockResolvedValueOnce(makeResponse("posts", ["a"], true, "c1"))
      .mockResolvedValueOnce(makeResponse("posts", ["b"], true, "c2"))
      .mockResolvedValueOnce(makeResponse("posts", ["c"], false, null));

    const result = await fetchAllSlugs("posts", QUERY);

    expect(result).toEqual([{ slug: "a" }, { slug: "b" }, { slug: "c" }]);
    expect(mockFetchGraphQL).toHaveBeenCalledTimes(3);
  });
});
