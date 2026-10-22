import type { APIContext } from "astro";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getAllRoastDinnerPosts } from "../../../lib/getAllRoastDinnerPosts";
import type { Post } from "../../../types";

vi.mock("../../../lib/getAllRoastDinnerPosts", () => ({
  getAllRoastDinnerPosts: vi.fn(),
}));

import { GET } from "./daily-post";

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    date: "2024-01-01",
    slug: "test-slug",
    title: "Test Post",
    ratings: { nodes: [{ name: "8" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/image.jpg" } },
    ...overrides,
  } as Post;
}

function makeContext(): APIContext {
  return {} as APIContext;
}

beforeEach(() => {
  vi.mocked(getAllRoastDinnerPosts).mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-05T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /roastle/api/daily-post", () => {
  test("returns 404 when there are no valid posts", async () => {
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([]);

    const response = await GET(makeContext());

    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("No posts available");
  });

  test("filters out posts missing a rating or an image", async () => {
    const valid = makePost({ slug: "valid" });
    const noRating = makePost({ slug: "no-rating", ratings: { nodes: [] } });
    const noImage = makePost({ slug: "no-image", featuredImage: undefined });
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([noRating, noImage, valid]);

    const response = await GET(makeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.slug).toBe("valid");
  });

  test("returns the post's slug, title, image and rating", async () => {
    const post = makePost({
      slug: "roast-dinner",
      title: "A Great Roast",
      ratings: { nodes: [{ name: "7.5" }] },
      featuredImage: { node: { sourceUrl: "https://example.com/roast.jpg" } },
    });
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([post]);

    const response = await GET(makeContext());
    const data = await response.json();

    expect(data).toEqual({
      slug: "roast-dinner",
      title: "A Great Roast",
      imageUrl: "https://example.com/roast.jpg",
      rating: 7.5,
    });
  });

  test("returns the same post for the same day across multiple calls", async () => {
    const posts = [makePost({ slug: "a" }), makePost({ slug: "b" }), makePost({ slug: "c" })];
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue(posts);

    const first = await (await GET(makeContext())).json();
    const second = await (await GET(makeContext())).json();

    expect(first.slug).toBe(second.slug);
  });
});
