import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGraphQL, resetGraphQLRequestCache } from "./api";

const GRAPHQL_URL = "https://blog.rdldn.co.uk/graphql";

function mockFetch(data: unknown, options: { ok?: boolean; errors?: unknown[] } = {}) {
  const { ok = true, errors } = options;
  const responseJson = errors ? { errors } : { data };
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: vi.fn().mockResolvedValue(responseJson),
    })
  );
}

describe("fetchGraphQL", () => {
  beforeEach(() => {
    resetGraphQLRequestCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("makes a POST request to the GraphQL endpoint with the query and variables", async () => {
    mockFetch({ posts: [] });
    const query = "{ posts { nodes { slug } } }";

    await fetchGraphQL(query, { first: 10 });

    expect(fetch).toHaveBeenCalledWith(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { first: 10 } }),
    });
  });

  it("defaults to an empty variables object when none are provided", async () => {
    mockFetch({ posts: [] });
    const query = "{ posts { nodes { slug } } }";

    await fetchGraphQL(query);

    expect(fetch).toHaveBeenCalledWith(
      GRAPHQL_URL,
      expect.objectContaining({
        body: JSON.stringify({ query, variables: {} }),
      })
    );
  });

  it("returns the data field from the GraphQL response", async () => {
    const data = { posts: { nodes: [{ slug: "test-post" }] } };
    mockFetch(data);

    const result = await fetchGraphQL("{ posts { nodes { slug } } }");

    expect(result).toEqual(data);
  });

  it("caches identical requests and only calls fetch once", async () => {
    mockFetch({ posts: [] });
    const query = "{ posts { nodes { slug } } }";

    const result1 = await fetchGraphQL(query);
    const result2 = await fetchGraphQL(query);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result1).toBe(result2);
  });

  it("caches concurrent identical requests and only calls fetch once", async () => {
    mockFetch({ posts: [] });
    const query = "{ posts { nodes { slug } } }";

    const [result1, result2] = await Promise.all([fetchGraphQL(query), fetchGraphQL(query)]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result1).toBe(result2);
  });

  it("treats requests with different variables as distinct cache entries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ data: { slug: "a" } }) })
        .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ data: { slug: "b" } }) })
    );
    const query = "{ post(slug: $slug) { title } }";

    const r1 = await fetchGraphQL(query, { slug: "a" });
    const r2 = await fetchGraphQL(query, { slug: "b" });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(r1).toEqual({ slug: "a" });
    expect(r2).toEqual({ slug: "b" });
  });

  it("produces the same cache key regardless of variable key order", async () => {
    mockFetch({ posts: [] });
    const query = "{ posts }";

    await fetchGraphQL(query, { b: "2", a: "1" });
    await fetchGraphQL(query, { a: "1", b: "2" });

    // stableStringify sorts keys, so both calls share a cache entry
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("throws on GraphQL errors and removes the failed request from the cache", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ errors: [{ message: "Not found" }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: { posts: [] } }),
        })
    );
    const query = "{ posts { nodes { slug } } }";

    await expect(fetchGraphQL(query)).rejects.toThrow("GraphQL Error");

    // The failed entry should be evicted so a retry can succeed
    const result = await fetchGraphQL(query);
    expect(result).toEqual({ posts: [] });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws on non-ok HTTP responses and removes the failed request from the cache", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: false, json: vi.fn().mockResolvedValue({}) })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: { status: "ok" } }),
        })
    );
    const query = "{ status }";

    await expect(fetchGraphQL(query)).rejects.toThrow("GraphQL Error");

    const result = await fetchGraphQL(query);
    expect(result).toEqual({ status: "ok" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("includes GraphQL error details in the thrown error message", async () => {
    const errors = [{ message: "Unauthorized" }];
    mockFetch(null, { errors });

    await expect(fetchGraphQL("{ me }")).rejects.toThrow(JSON.stringify(errors));
  });

  it("resetGraphQLRequestCache clears the cache so subsequent calls re-fetch", async () => {
    mockFetch({ posts: [] });
    const query = "{ posts { nodes { slug } } }";

    await fetchGraphQL(query);
    resetGraphQLRequestCache();

    // After reset the second call must hit the network again
    vi.unstubAllGlobals();
    mockFetch({ posts: [{ slug: "new" }] });

    const result = await fetchGraphQL(query);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ posts: [{ slug: "new" }] });
  });
});
