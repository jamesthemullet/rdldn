import { describe, expect, test } from "vitest";
import type { Post } from "../types";
import { computeValueScores } from "./valueScore";

const createPost = ({
  title,
  rating,
  price,
  year,
}: {
  title: string;
  rating: string;
  price: string;
  year?: string;
}): Post => ({
  date: "2026-01-01",
  title,
  slug: title.toLowerCase().replace(/\s+/g, "-"),
  ratings: { nodes: [{ name: rating }] },
  prices: { nodes: [{ name: price }] },
  ...(year ? { yearsOfVisit: { nodes: [{ name: year }] } } : {}),
});

describe("computeValueScores", () => {
  test("computes value score as rating divided by raw price when no inflation data applies", () => {
    const posts = [createPost({ title: "Cheap Good Roast", rating: "8", price: "£10" })];

    const [scored] = computeValueScores(posts, {});

    expect(scored.rawPrice).toBe(10);
    expect(scored.adjustedPrice).toBe(10);
    expect(scored.valueScore).toBe(0.8);
  });

  test("applies the inflation multiplier for the post's visit year to the price", () => {
    const posts = [createPost({ title: "Old Cheap Roast", rating: "8", price: "£10", year: "2018" })];

    const [scored] = computeValueScores(posts, { "2018": 1.5 });

    expect(scored.adjustedPrice).toBe(15);
    expect(scored.valueScore).toBeCloseTo(8 / 15);
  });

  test("excludes posts with missing or invalid rating or price", () => {
    const posts = [
      createPost({ title: "No Rating", rating: "", price: "£10" }),
      createPost({ title: "No Price", rating: "8", price: "" }),
      createPost({ title: "Zero Rating", rating: "0", price: "£10" }),
      createPost({ title: "Valid", rating: "9", price: "£12" }),
    ];

    const scored = computeValueScores(posts, {});

    expect(scored.map((s) => s.post.title)).toEqual(["Valid"]);
  });
});
