import { describe, expect, test, vi } from "vitest";

const getHomepageHighlightsMock = vi.fn();

vi.mock("../../lib/homepage-highlights", () => ({
  getHomepageHighlights: getHomepageHighlightsMock,
}));

describe("GET /api/homepage-highlights.json", () => {
  test("returns the homepage highlights as JSON", async () => {
    const highlights = {
      bestRoasts: [{ slug: "best-roast", title: "Best Roast" }],
      features: [{ slug: "feature-1", title: "Feature 1" }],
      roastStatistics: [{ slug: "page-4102", title: "Page 4102" }],
    };
    getHomepageHighlightsMock.mockResolvedValue(highlights);

    const { GET } = await import("./homepage-highlights.json");
    const response = await GET({} as never);

    expect(response.headers.get("Content-Type")).toBe("application/json");
    const data = await response.json();
    expect(data).toEqual(highlights);
  });
});
