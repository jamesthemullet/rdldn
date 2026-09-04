import { describe, expect, test, vi } from "vitest";

const getAllRoastDinnerPostsMock = vi.fn();

vi.mock("../../../lib/getAllRoastDinnerPosts", () => ({
  getAllRoastDinnerPosts: getAllRoastDinnerPostsMock,
}));

describe("GET /api/roastle/post-of-the-day.json", () => {
  test("returns today's post as JSON", async () => {
    getAllRoastDinnerPostsMock.mockResolvedValue([
      {
        date: "2026-01-01",
        title: "Roast A",
        slug: "roast-a",
        ratings: { nodes: [{ name: "8" }] },
        featuredImage: { node: { sourceUrl: "https://example.com/a.jpg" } },
      },
    ]);

    const { GET } = await import("./post-of-the-day.json");
    const response = await GET({} as never);

    expect(response.headers.get("Content-Type")).toBe("application/json");
    const data = await response.json();
    expect(data).toEqual({
      title: "Roast A",
      slug: "roast-a",
      imageUrl: "https://example.com/a.jpg",
      rating: 8,
    });
  });

  test("returns 404 when there are no eligible posts", async () => {
    getAllRoastDinnerPostsMock.mockResolvedValue([]);

    const { GET } = await import("./post-of-the-day.json");
    const response = await GET({} as never);

    expect(response.status).toBe(404);
  });
});
