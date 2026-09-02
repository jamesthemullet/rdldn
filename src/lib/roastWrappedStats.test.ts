import { describe, expect, it } from "vitest";
import type { Post } from "../types";
import { computeRoastWrappedStats } from "./roastWrappedStats";
import type { Visit } from "./schema";

function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: "visit-1",
    userId: "user-1",
    postSlug: "test-slug",
    postTitle: "Test Post",
    postRating: null,
    visitedAt: new Date("2024-06-01"),
    notes: null,
    ...overrides,
  } as Visit;
}

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    date: "2024-01-01",
    slug: "test-slug",
    title: "Test Post",
    ...overrides,
  } as Post;
}

describe("computeRoastWrappedStats", () => {
  it("returns zeroed stats for no visits", () => {
    expect(computeRoastWrappedStats([], [], 2024)).toEqual({
      year: 2024,
      visitCount: 0,
      boroughsVisited: 0,
      bestValueFind: null,
    });
  });

  it("only counts visits from the given year", () => {
    const visits = [
      makeVisit({ postSlug: "a", visitedAt: new Date("2024-03-01") }),
      makeVisit({ postSlug: "b", visitedAt: new Date("2023-12-01") }),
    ];
    const posts = [makePost({ slug: "a" }), makePost({ slug: "b" })];

    expect(computeRoastWrappedStats(visits, posts, 2024).visitCount).toBe(1);
  });

  it("counts distinct boroughs across the year's visited posts", () => {
    const visits = [
      makeVisit({ postSlug: "a", visitedAt: new Date("2024-01-01") }),
      makeVisit({ postSlug: "b", visitedAt: new Date("2024-02-01") }),
      makeVisit({ postSlug: "c", visitedAt: new Date("2024-03-01") }),
    ];
    const posts = [
      makePost({ slug: "a", boroughs: { nodes: [{ name: "Hackney" }] } }),
      makePost({ slug: "b", boroughs: { nodes: [{ name: "Camden" }] } }),
      makePost({ slug: "c", boroughs: { nodes: [{ name: "Hackney" }] } }),
    ];

    expect(computeRoastWrappedStats(visits, posts, 2024).boroughsVisited).toBe(2);
  });

  it("finds the best-value visited post by value score", () => {
    const visits = [
      makeVisit({ postSlug: "a", visitedAt: new Date("2024-01-01") }),
      makeVisit({ postSlug: "b", visitedAt: new Date("2024-02-01") }),
    ];
    const posts = [
      makePost({
        slug: "a",
        title: "Cheap and cheerful",
        ratings: { nodes: [{ name: "8" }] },
        prices: { nodes: [{ name: "£10" }] },
      }),
      makePost({
        slug: "b",
        title: "Pricey",
        ratings: { nodes: [{ name: "8" }] },
        prices: { nodes: [{ name: "£40" }] },
      }),
    ];

    expect(computeRoastWrappedStats(visits, posts, 2024).bestValueFind).toEqual({
      postSlug: "a",
      postTitle: "Cheap and cheerful",
      valueScore: 0.8,
    });
  });

  it("ignores visits whose post can no longer be found in the catalog", () => {
    const visits = [makeVisit({ postSlug: "missing", visitedAt: new Date("2024-01-01") })];

    const stats = computeRoastWrappedStats(visits, [], 2024);

    expect(stats.boroughsVisited).toBe(0);
    expect(stats.bestValueFind).toBeNull();
  });

  it("ignores visits from other years when finding the best-value find", () => {
    const visits = [makeVisit({ postSlug: "a", visitedAt: new Date("2023-01-01") })];
    const posts = [
      makePost({
        slug: "a",
        ratings: { nodes: [{ name: "9" }] },
        prices: { nodes: [{ name: "£10" }] },
      }),
    ];

    expect(computeRoastWrappedStats(visits, posts, 2024).bestValueFind).toBeNull();
  });
});
