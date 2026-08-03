import { describe, expect, it } from "vitest";
import type { Post } from "../types";
import { BADGES, computeEarnedBadges } from "./badges";
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

describe("computeEarnedBadges", () => {
  it("returns no badges when there are no visits", () => {
    expect(computeEarnedBadges([], [])).toEqual([]);
  });

  it("awards First Roast for a single visit", () => {
    const visits = [makeVisit()];
    const posts = [makePost()];

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).toContain("first-roast");
  });

  it("awards Century Club at 100 visits", () => {
    const visits = Array.from({ length: 100 }, (_, i) => makeVisit({ postSlug: `slug-${i}` }));

    const badges = computeEarnedBadges(visits, []);

    expect(badges.map((b) => b.key)).toContain("century-club");
  });

  it("does not award Century Club below 100 visits", () => {
    const visits = Array.from({ length: 99 }, (_, i) => makeVisit({ postSlug: `slug-${i}` }));

    const badges = computeEarnedBadges(visits, []);

    expect(badges.map((b) => b.key)).not.toContain("century-club");
  });

  it("awards Carnivore for visits covering 5 distinct meats", () => {
    const meats = ["Beef", "Lamb", "Pork", "Chicken", "Turkey"];
    const visits = meats.map((_, i) => makeVisit({ postSlug: `slug-${i}` }));
    const posts = meats.map((meat, i) =>
      makePost({ slug: `slug-${i}`, meats: { nodes: [{ name: meat }] } })
    );

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).toContain("carnivore");
  });

  it("does not award Carnivore for fewer than 5 distinct meats", () => {
    const visits = [makeVisit({ postSlug: "a" }), makeVisit({ postSlug: "b" })];
    const posts = [
      makePost({ slug: "a", meats: { nodes: [{ name: "Beef" }] } }),
      makePost({ slug: "b", meats: { nodes: [{ name: "Beef" }] } }),
    ];

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).not.toContain("carnivore");
  });

  it("awards North-South Divide when both North and South London are visited", () => {
    const visits = [makeVisit({ postSlug: "north" }), makeVisit({ postSlug: "south" })];
    const posts = [
      makePost({ slug: "north", areas: { nodes: [{ name: "North London" }] } }),
      makePost({ slug: "south", areas: { nodes: [{ name: "South London" }] } }),
    ];

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).toContain("north-south-divide");
  });

  it("does not award North-South Divide with only North London visits", () => {
    const visits = [makeVisit({ postSlug: "north" })];
    const posts = [makePost({ slug: "north", areas: { nodes: [{ name: "North London" }] } })];

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).not.toContain("north-south-divide");
  });

  it("awards All-Rounder when every major area has been visited", () => {
    const areas = ["North London", "South London", "East London", "West London", "Central London"];
    const visits = areas.map((_, i) => makeVisit({ postSlug: `slug-${i}` }));
    const posts = areas.map((area, i) => makePost({ slug: `slug-${i}`, areas: { nodes: [{ name: area }] } }));

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).toContain("all-rounder");
  });

  it("does not award All-Rounder when an area is missing", () => {
    const areas = ["North London", "South London", "East London", "West London"];
    const visits = areas.map((_, i) => makeVisit({ postSlug: `slug-${i}` }));
    const posts = areas.map((area, i) => makePost({ slug: `slug-${i}`, areas: { nodes: [{ name: area }] } }));

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).not.toContain("all-rounder");
  });

  it("awards Gold Standard for 10 visits rated 8.5+", () => {
    const visits = Array.from({ length: 10 }, (_, i) => makeVisit({ postSlug: `slug-${i}` }));
    const posts = Array.from({ length: 10 }, (_, i) =>
      makePost({ slug: `slug-${i}`, ratings: { nodes: [{ name: "9" }] } })
    );

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).toContain("gold-standard");
  });

  it("does not award Gold Standard for fewer than 10 high-rated visits", () => {
    const visits = Array.from({ length: 9 }, (_, i) => makeVisit({ postSlug: `slug-${i}` }));
    const posts = Array.from({ length: 9 }, (_, i) =>
      makePost({ slug: `slug-${i}`, ratings: { nodes: [{ name: "9" }] } })
    );

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).not.toContain("gold-standard");
  });

  it("awards Bargain Hunter for 5 visits under £15 rated above 8", () => {
    const visits = Array.from({ length: 5 }, (_, i) => makeVisit({ postSlug: `slug-${i}` }));
    const posts = Array.from({ length: 5 }, (_, i) =>
      makePost({
        slug: `slug-${i}`,
        ratings: { nodes: [{ name: "8.5" }] },
        prices: { nodes: [{ name: "£12" }] },
      })
    );

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).toContain("bargain-hunter");
  });

  it("does not award Bargain Hunter when the price is too high", () => {
    const visits = Array.from({ length: 5 }, (_, i) => makeVisit({ postSlug: `slug-${i}` }));
    const posts = Array.from({ length: 5 }, (_, i) =>
      makePost({
        slug: `slug-${i}`,
        ratings: { nodes: [{ name: "8.5" }] },
        prices: { nodes: [{ name: "£20" }] },
      })
    );

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).not.toContain("bargain-hunter");
  });

  it("awards Loyal Subject for visiting the same restaurant 3+ times", () => {
    const visits = [
      makeVisit({ postSlug: "regular", visitedAt: new Date("2024-01-01") }),
      makeVisit({ postSlug: "regular", visitedAt: new Date("2024-02-01") }),
      makeVisit({ postSlug: "regular", visitedAt: new Date("2024-03-01") }),
    ];
    const posts = [makePost({ slug: "regular" })];

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).toContain("loyal-subject");
  });

  it("does not award Loyal Subject for only 2 visits to the same restaurant", () => {
    const visits = [
      makeVisit({ postSlug: "regular", visitedAt: new Date("2024-01-01") }),
      makeVisit({ postSlug: "regular", visitedAt: new Date("2024-02-01") }),
    ];
    const posts = [makePost({ slug: "regular" })];

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).not.toContain("loyal-subject");
  });

  it("awards Zone Trotter when every zone across the catalog has been visited", () => {
    const visits = [makeVisit({ postSlug: "a" }), makeVisit({ postSlug: "b" })];
    const posts = [
      makePost({ slug: "a", zones: { nodes: [{ name: "Zone 1" }] } }),
      makePost({ slug: "b", zones: { nodes: [{ name: "Zone 2" }] } }),
    ];

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).toContain("zone-trotter");
  });

  it("does not award Zone Trotter when a catalog zone is unvisited", () => {
    const visits = [makeVisit({ postSlug: "a" })];
    const posts = [
      makePost({ slug: "a", zones: { nodes: [{ name: "Zone 1" }] } }),
      makePost({ slug: "b", zones: { nodes: [{ name: "Zone 2" }] } }),
    ];

    const badges = computeEarnedBadges(visits, posts);

    expect(badges.map((b) => b.key)).not.toContain("zone-trotter");
  });

  it("ignores visits whose post can no longer be found in the catalog", () => {
    const visits = [makeVisit({ postSlug: "missing" })];

    const badges = computeEarnedBadges(visits, []);

    expect(badges.map((b) => b.key)).toEqual(["first-roast"]);
  });

  it("returns badges in the canonical BADGES order", () => {
    const visits = Array.from({ length: 100 }, (_, i) => makeVisit({ postSlug: `slug-${i}` }));

    const badges = computeEarnedBadges(visits, []);
    const canonicalOrder = BADGES.map((b) => b.key);
    const earnedOrder = badges.map((b) => b.key);

    expect(earnedOrder).toEqual(canonicalOrder.filter((key) => earnedOrder.includes(key)));
  });
});
