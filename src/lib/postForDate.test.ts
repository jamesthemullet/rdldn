import { describe, expect, test } from "vitest";
import type { Post } from "../types";
import { postForDate } from "./postForDate";

const createPost = ({
  title,
  slug,
  rating,
  imageUrl = "https://example.com/image.jpg",
}: {
  title: string;
  slug: string;
  rating: string;
  imageUrl?: string;
}): Post => ({
  date: "2026-01-01",
  title,
  slug,
  ratings: { nodes: [{ name: rating }] },
  featuredImage: { node: { sourceUrl: imageUrl } },
});

describe("postForDate", () => {
  test("returns the same post for the same date across multiple calls", () => {
    const posts = [
      createPost({ title: "Roast A", slug: "roast-a", rating: "8" }),
      createPost({ title: "Roast B", slug: "roast-b", rating: "6" }),
      createPost({ title: "Roast C", slug: "roast-c", rating: "9" }),
    ];
    const date = new Date("2026-03-14T00:00:00Z");

    const first = postForDate(date, posts);
    const second = postForDate(date, posts);

    expect(first).toEqual(second);
  });

  test("can return different posts for different dates", () => {
    const posts = [
      createPost({ title: "Roast A", slug: "roast-a", rating: "8" }),
      createPost({ title: "Roast B", slug: "roast-b", rating: "6" }),
      createPost({ title: "Roast C", slug: "roast-c", rating: "9" }),
      createPost({ title: "Roast D", slug: "roast-d", rating: "7" }),
      createPost({ title: "Roast E", slug: "roast-e", rating: "5" }),
    ];

    const results = new Set(
      Array.from({ length: 30 }, (_, day) =>
        postForDate(new Date(2026, 0, day + 1), posts)?.slug
      )
    );

    expect(results.size).toBeGreaterThan(1);
  });

  test("is independent of the input array's order", () => {
    const posts = [
      createPost({ title: "Roast A", slug: "roast-a", rating: "8" }),
      createPost({ title: "Roast B", slug: "roast-b", rating: "6" }),
    ];
    const reversed = [...posts].reverse();
    const date = new Date("2026-03-14T00:00:00Z");

    expect(postForDate(date, posts)).toEqual(postForDate(date, reversed));
  });

  test("excludes posts with missing or invalid rating, image, or slug", () => {
    const posts = [
      createPost({ title: "No Rating", slug: "no-rating", rating: "" }),
      createPost({ title: "Zero Rating", slug: "zero-rating", rating: "0" }),
      createPost({ title: "Bad Rating", slug: "bad-rating", rating: "abc" }),
      createPost({ title: "Valid", slug: "valid", rating: "9" }),
      { ...createPost({ title: "No Image", slug: "no-image", rating: "9" }), featuredImage: undefined },
    ];

    const result = postForDate(new Date("2026-03-14T00:00:00Z"), posts);

    expect(result?.slug).toBe("valid");
  });

  test("returns null when there are no eligible posts", () => {
    const posts = [createPost({ title: "No Rating", slug: "no-rating", rating: "" })];

    expect(postForDate(new Date("2026-03-14T00:00:00Z"), posts)).toBeNull();
  });
});
