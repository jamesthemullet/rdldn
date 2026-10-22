import { describe, expect, it } from "vitest";
import type { Post } from "../types";
import type { Visit } from "./schema";
import { buildYearlyWrappedStats } from "./yearlyWrappedStats";

function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: "visit-id",
    userId: "user-id",
    postSlug: "test-slug",
    postTitle: "Test Post",
    postRating: null,
    userRating: null,
    visitedAt: new Date("2024-06-01T00:00:00Z"),
    notes: null,
    ...overrides,
  } as Visit;
}

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    date: "2024-01-01",
    slug: "test-slug",
    title: "Test Post",
    ratings: { nodes: [{ name: "8" }] },
    prices: { nodes: [{ name: "£20" }] },
    boroughs: { nodes: [{ name: "Hackney" }] },
    ...overrides,
  } as Post;
}

describe("buildYearlyWrappedStats", () => {
  it("counts only visits within the requested year", () => {
    const visits = [
      makeVisit({ postSlug: "a", visitedAt: new Date("2024-01-01T00:00:00Z") }),
      makeVisit({ postSlug: "b", visitedAt: new Date("2023-12-31T00:00:00Z") }),
    ];
    const posts = [makePost({ slug: "a" }), makePost({ slug: "b" })];

    const result = buildYearlyWrappedStats(visits, posts, "2024");

    expect(result.totalVisits).toBe(1);
  });

  it("returns an empty result for a year with no visits", () => {
    const result = buildYearlyWrappedStats([], [], "2024");

    expect(result).toEqual({
      year: "2024",
      totalVisits: 0,
      favouriteBorough: null,
      bestValueFind: null,
    });
  });

  it("picks the most-visited borough, breaking ties alphabetically", () => {
    const visits = [
      makeVisit({ postSlug: "a" }),
      makeVisit({ postSlug: "b" }),
      makeVisit({ postSlug: "c" }),
    ];
    const posts = [
      makePost({ slug: "a", boroughs: { nodes: [{ name: "Hackney" }] } }),
      makePost({ slug: "b", boroughs: { nodes: [{ name: "Camden" }] } }),
      makePost({ slug: "c", boroughs: { nodes: [{ name: "Hackney" }] } }),
    ];

    const result = buildYearlyWrappedStats(visits, posts, "2024");

    expect(result.favouriteBorough).toBe("Hackney");
  });

  it("ignores placeholder borough values like n/a", () => {
    const visits = [makeVisit({ postSlug: "a" })];
    const posts = [makePost({ slug: "a", boroughs: { nodes: [{ name: "N/A" }] } })];

    const result = buildYearlyWrappedStats(visits, posts, "2024");

    expect(result.favouriteBorough).toBeNull();
  });

  it("picks the visit with the highest rating-to-price ratio as the best-value find", () => {
    const visits = [makeVisit({ postSlug: "pricey" }), makeVisit({ postSlug: "bargain" })];
    const posts = [
      makePost({
        slug: "pricey",
        title: "Pricey Roast",
        ratings: { nodes: [{ name: "9" }] },
        prices: { nodes: [{ name: "£40" }] },
      }),
      makePost({
        slug: "bargain",
        title: "Bargain Roast",
        ratings: { nodes: [{ name: "8" }] },
        prices: { nodes: [{ name: "£15" }] },
      }),
    ];

    const result = buildYearlyWrappedStats(visits, posts, "2024");

    expect(result.bestValueFind).toMatchObject({ slug: "bargain", title: "Bargain Roast" });
  });

  it("ignores visits whose post has no rating or price", () => {
    const visits = [makeVisit({ postSlug: "a" })];
    const posts = [makePost({ slug: "a", ratings: { nodes: [] }, prices: { nodes: [] } })];

    const result = buildYearlyWrappedStats(visits, posts, "2024");

    expect(result.bestValueFind).toBeNull();
  });

  it("ignores visits that have no matching post", () => {
    const visits = [makeVisit({ postSlug: "missing" })];

    const result = buildYearlyWrappedStats(visits, [], "2024");

    expect(result.totalVisits).toBe(1);
    expect(result.favouriteBorough).toBeNull();
    expect(result.bestValueFind).toBeNull();
  });
});
