import { describe, expect, it } from "vitest";
import type { Post } from "../types";
import { computeInflationIndex } from "./inflationIndex";

function makePost(year: string | undefined, price: string | undefined): Post {
  return {
    date: "2024-01-01",
    yearsOfVisit: year ? { nodes: [{ name: year }] } : { nodes: [] },
    prices: price ? { nodes: [{ name: price }] } : { nodes: [] },
  } as Post;
}

describe("computeInflationIndex", () => {
  it("returns empty results when given no posts", () => {
    const { inflationIndex, mostRecentYear } = computeInflationIndex([]);

    expect(inflationIndex).toEqual({});
    expect(mostRecentYear).toBe("");
  });

  it("sets the most recent year as the base (index = 1)", () => {
    const posts = [makePost("2023", "£18"), makePost("2024", "£20")];

    const { inflationIndex, mostRecentYear } = computeInflationIndex(posts);

    expect(mostRecentYear).toBe("2024");
    expect(inflationIndex["2024"]).toBe(1);
  });

  it("computes older years' indices relative to the most recent median", () => {
    const posts = [
      makePost("2022", "£15"),
      makePost("2023", "£18"),
      makePost("2024", "£20"),
    ];

    const { inflationIndex } = computeInflationIndex(posts);

    expect(inflationIndex["2024"]).toBeCloseTo(1.0);
    expect(inflationIndex["2023"]).toBeCloseTo(20 / 18);
    expect(inflationIndex["2022"]).toBeCloseTo(20 / 15);
  });

  it("uses median not average for each year (odd-length array)", () => {
    // median of [10, 20, 90] = 20; average would be 40
    const posts2024 = [
      makePost("2024", "£10"),
      makePost("2024", "£20"),
      makePost("2024", "£90"),
    ];
    const posts2023 = [makePost("2023", "£40")];

    const { inflationIndex } = computeInflationIndex([...posts2024, ...posts2023]);

    // base = 2024 median = 20; 2023 median = 40 → index = 20/40 = 0.5
    expect(inflationIndex["2023"]).toBeCloseTo(0.5);
  });

  it("uses even-length median (average of the two middle values)", () => {
    // median of [10, 20] = 15
    const posts2024 = [makePost("2024", "£10"), makePost("2024", "£20")];
    // median of [30] = 30 → index = 15/30 = 0.5
    const posts2023 = [makePost("2023", "£30")];

    const { inflationIndex } = computeInflationIndex([...posts2024, ...posts2023]);

    expect(inflationIndex["2023"]).toBeCloseTo(0.5);
  });

  it("strips the currency symbol and parses price as a float", () => {
    const posts = [makePost("2024", "£18.50")];

    const { inflationIndex } = computeInflationIndex(posts);

    expect(inflationIndex["2024"]).toBe(1);
  });

  it("handles prices with thousands separators", () => {
    const posts2024 = [makePost("2024", "£1,200")];
    const posts2023 = [makePost("2023", "£600")];

    const { inflationIndex } = computeInflationIndex([...posts2024, ...posts2023]);

    expect(inflationIndex["2023"]).toBeCloseTo(1200 / 600);
  });

  it("skips posts with no year", () => {
    const posts = [makePost(undefined, "£18")];

    const { inflationIndex, mostRecentYear } = computeInflationIndex(posts);

    expect(Object.keys(inflationIndex)).toHaveLength(0);
    expect(mostRecentYear).toBe("");
  });

  it("skips posts with no price", () => {
    const posts = [makePost("2024", undefined)];

    const { inflationIndex } = computeInflationIndex(posts);

    expect(Object.keys(inflationIndex)).toHaveLength(0);
  });

  it("skips posts with a zero price", () => {
    const posts = [makePost("2024", "£0")];

    const { inflationIndex } = computeInflationIndex(posts);

    expect(Object.keys(inflationIndex)).toHaveLength(0);
  });

  it("skips posts with a non-numeric price string", () => {
    const posts = [makePost("2024", "N/A")];

    const { inflationIndex } = computeInflationIndex(posts);

    expect(Object.keys(inflationIndex)).toHaveLength(0);
  });

  it("mixes valid and invalid posts, only counting the valid ones", () => {
    const posts = [
      makePost("2024", "£20"),
      makePost(undefined, "£20"),
      makePost("2024", "N/A"),
      makePost("2023", "£10"),
    ];

    const { inflationIndex, mostRecentYear } = computeInflationIndex(posts);

    expect(mostRecentYear).toBe("2024");
    expect(inflationIndex["2024"]).toBe(1);
    expect(inflationIndex["2023"]).toBeCloseTo(20 / 10);
  });
});
