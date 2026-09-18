import { describe, expect, test, vi } from "vitest";

vi.mock("./db", () => ({ db: { select: vi.fn() } }));

import type { Post } from "../types";
import { db } from "./db";
import { buildYearlyWrappedStats, getVisitsForYear } from "./roastWrapped";
import type { Visit } from "./schema";

function makeSelectChain(result: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(result),
  };
}

function createVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: "visit-id",
    userId: "user-id",
    postSlug: "some-roast",
    postTitle: "Some Roast",
    postRating: null,
    userRating: null,
    visitedAt: new Date("2026-03-01T00:00:00Z"),
    notes: null,
    ...overrides,
  };
}

function createPost(overrides: Partial<Post> = {}): Post {
  return {
    date: "2026-01-01",
    ...overrides,
  };
}

describe("getVisitsForYear", () => {
  test("queries visits for the user within the given calendar year", async () => {
    const rows = [createVisit()];
    const chain = makeSelectChain(rows);
    vi.mocked(db.select).mockReturnValue(chain as never);

    const result = await getVisitsForYear("user-id", 2026);

    expect(result).toEqual(rows);
    expect(chain.where).toHaveBeenCalledTimes(1);
  });
});

describe("buildYearlyWrappedStats", () => {
  test("counts visits, ranks boroughs, and finds the best-value visited post", () => {
    const yearVisits = [
      createVisit({ postSlug: "roast-a" }),
      createVisit({ postSlug: "roast-b" }),
      createVisit({ postSlug: "roast-c" }),
    ];
    const posts = [
      createPost({
        slug: "roast-a",
        title: "Roast A",
        boroughs: { nodes: [{ name: "Hackney" }] },
        ratings: { nodes: [{ name: "8" }] },
        prices: { nodes: [{ name: "£20" }] },
      }),
      createPost({
        slug: "roast-b",
        title: "Roast B",
        boroughs: { nodes: [{ name: "Hackney" }] },
        ratings: { nodes: [{ name: "9" }] },
        prices: { nodes: [{ name: "£15" }] },
      }),
      createPost({
        slug: "roast-c",
        title: "Roast C",
        boroughs: { nodes: [{ name: "Camden" }] },
        ratings: { nodes: [{ name: "6" }] },
        prices: { nodes: [{ name: "£25" }] },
      }),
    ];

    const stats = buildYearlyWrappedStats(2026, yearVisits, posts);

    expect(stats.year).toBe(2026);
    expect(stats.visitCount).toBe(3);
    expect(stats.boroughCounts).toEqual([
      { borough: "Hackney", count: 2 },
      { borough: "Camden", count: 1 },
    ]);
    expect(stats.favouriteBorough).toBe("Hackney");
    expect(stats.bestValueFind).toEqual({
      slug: "roast-b",
      title: "Roast B",
      valueScore: 9 / 15,
    });
  });

  test("returns empty/null aggregates when there are no visits", () => {
    const stats = buildYearlyWrappedStats(2026, [], []);

    expect(stats).toEqual({
      year: 2026,
      visitCount: 0,
      boroughCounts: [],
      favouriteBorough: null,
      bestValueFind: null,
    });
  });

  test("ignores visited posts with no matching post data or missing price/rating", () => {
    const yearVisits = [createVisit({ postSlug: "no-longer-in-graphql" })];

    const stats = buildYearlyWrappedStats(2026, yearVisits, []);

    expect(stats.visitCount).toBe(1);
    expect(stats.boroughCounts).toEqual([]);
    expect(stats.favouriteBorough).toBeNull();
    expect(stats.bestValueFind).toBeNull();
  });
});
