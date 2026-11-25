import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Post } from "../../../types";

vi.mock("../../../lib/getGamePosts", () => ({
  getGamePosts: vi.fn(),
}));

import { getGamePosts } from "../../../lib/getGamePosts";
import { GET } from "./posts";

const validPost = (slug: string, rating: string) =>
  ({
    title: slug,
    slug,
    featuredImage: { node: { sourceUrl: `https://example.com/${slug}.jpg` } },
    ratings: { nodes: [{ name: rating }] },
  }) as unknown as Post;

describe("GET /guessthescore/api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns only posts with an image and a 0–10 rating, with a CDN cache header", async () => {
    vi.mocked(getGamePosts).mockResolvedValue([
      validPost("good", "7.5"),
      { ...validPost("no-rating", "8"), ratings: undefined } as Post,
      { ...validPost("no-image", "8"), featuredImage: undefined } as Post,
      validPost("out-of-range", "15"),
      validPost("not-a-number", "n/a"),
    ]);

    const response = await GET({} as unknown as APIContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=86400");
    expect(response.headers.get("Cache-Control")).toContain("stale-while-revalidate");
    expect(data).toEqual([
      { title: "good", slug: "good", imageUrl: "https://example.com/good.jpg", rating: 7.5 },
    ]);
  });

  test("returns a 502 that the CDN won't cache when WordPress fails", async () => {
    vi.mocked(getGamePosts).mockRejectedValue(new Error("GraphQL down"));

    const response = await GET({} as unknown as APIContext);

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
