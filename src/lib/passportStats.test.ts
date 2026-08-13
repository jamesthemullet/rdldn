import { describe, expect, it } from "vitest";
import type { Post } from "../types";
import { computePassportStats } from "./passportStats";
import type { Visit } from "./schema";

function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: "visit-1",
    userId: "user-1",
    postSlug: "test-slug",
    postTitle: "Test Post",
    postRating: null,
    visitedAt: new Date("2024-01-01"),
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

describe("computePassportStats", () => {
  it("returns zeroed stats for no visits", () => {
    expect(computePassportStats([], [])).toEqual({
      totalVisits: 0,
      zonesVisited: 0,
      favouriteMeat: null,
      topRatedVisit: null,
    });
  });

  it("counts total visits", () => {
    const visits = [makeVisit({ postSlug: "a" }), makeVisit({ postSlug: "b" })];
    const posts = [makePost({ slug: "a" }), makePost({ slug: "b" })];

    expect(computePassportStats(visits, posts).totalVisits).toBe(2);
  });

  it("counts distinct zones across visited posts", () => {
    const visits = [makeVisit({ postSlug: "a" }), makeVisit({ postSlug: "b" }), makeVisit({ postSlug: "c" })];
    const posts = [
      makePost({ slug: "a", zones: { nodes: [{ name: "Zone 1" }] } }),
      makePost({ slug: "b", zones: { nodes: [{ name: "Zone 2" }] } }),
      makePost({ slug: "c", zones: { nodes: [{ name: "Zone 1" }] } }),
    ];

    expect(computePassportStats(visits, posts).zonesVisited).toBe(2);
  });

  it("picks the most frequently visited meat as favourite", () => {
    const visits = [makeVisit({ postSlug: "a" }), makeVisit({ postSlug: "b" }), makeVisit({ postSlug: "c" })];
    const posts = [
      makePost({ slug: "a", meats: { nodes: [{ name: "Beef" }] } }),
      makePost({ slug: "b", meats: { nodes: [{ name: "Beef" }] } }),
      makePost({ slug: "c", meats: { nodes: [{ name: "Lamb" }] } }),
    ];

    expect(computePassportStats(visits, posts).favouriteMeat).toBe("Beef");
  });

  it("finds the highest-rated visit", () => {
    const visits = [
      makeVisit({ postSlug: "a", postTitle: "A", postRating: "7.5" }),
      makeVisit({ postSlug: "b", postTitle: "B", postRating: "9.2" }),
      makeVisit({ postSlug: "c", postTitle: "C", postRating: "8.1" }),
    ];
    const posts = [makePost({ slug: "a" }), makePost({ slug: "b" }), makePost({ slug: "c" })];

    expect(computePassportStats(visits, posts).topRatedVisit).toEqual({
      postSlug: "b",
      postTitle: "B",
      rating: 9.2,
    });
  });

  it("ignores visits with no rating when finding the top-rated visit", () => {
    const visits = [makeVisit({ postSlug: "a", postTitle: "A", postRating: null })];
    const posts = [makePost({ slug: "a" })];

    expect(computePassportStats(visits, posts).topRatedVisit).toBeNull();
  });

  it("ignores visits whose post can no longer be found in the catalog", () => {
    const visits = [makeVisit({ postSlug: "missing" })];

    const stats = computePassportStats(visits, []);

    expect(stats.zonesVisited).toBe(0);
    expect(stats.favouriteMeat).toBeNull();
  });
});
