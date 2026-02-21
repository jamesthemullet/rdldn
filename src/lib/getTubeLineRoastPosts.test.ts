import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "../types";
import { getAllRoastDinnerPosts } from "./getAllRoastDinnerPosts";
import { getTubeLineRoastPosts } from "./getTubeLineRoastPosts";

vi.mock("./getAllRoastDinnerPosts", () => ({
  getAllRoastDinnerPosts: vi.fn(),
}));

const mockGetAllRoastDinnerPosts = getAllRoastDinnerPosts as unknown as Mock;

describe("getTubeLineRoastPosts", () => {
  beforeEach(() => {
    mockGetAllRoastDinnerPosts.mockReset();
  });

  it("returns posts that match station, rating, and open status", async () => {
    const matchingPost: Post = {
      slug: "matching",
      date: "2024-01-01",
      ratings: { nodes: [{ name: "8" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] },
      tubeStations: { nodes: [{ name: "Waterloo" }] },
      closedDowns: { nodes: [] },
    } as Post;

    const wrongStation: Post = {
      slug: "wrong-station",
      date: "2024-01-01",
      ratings: { nodes: [{ name: "8" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] },
      tubeStations: { nodes: [{ name: "Bank" }] },
      closedDowns: { nodes: [] },
    } as Post;

    const lowRating: Post = {
      slug: "low-rating",
      date: "2024-01-01",
      ratings: { nodes: [{ name: "6" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] },
      tubeStations: { nodes: [{ name: "Waterloo" }] },
      closedDowns: { nodes: [] },
    } as Post;

    const closedDown: Post = {
      slug: "closed",
      date: "2024-01-01",
      ratings: { nodes: [{ name: "9" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] },
      tubeStations: { nodes: [{ name: "Waterloo" }] },
      closedDowns: { nodes: [{ name: "Closed" }] },
    } as Post;

    mockGetAllRoastDinnerPosts.mockResolvedValueOnce([
      matchingPost,
      wrongStation,
      lowRating,
      closedDown,
    ]);

    const result = await getTubeLineRoastPosts(["Waterloo"]);

    expect(result).toEqual([matchingPost]);
  });

  it("supports a custom minimum rating", async () => {
    const sevenPointTwoPost: Post = {
      slug: "seven-two",
      date: "2024-01-01",
      ratings: { nodes: [{ name: "7.2" }] },
      yearsOfVisit: { nodes: [{ name: "2024" }] },
      tubeStations: { nodes: [{ name: "Waterloo" }] },
      closedDowns: { nodes: [] },
    } as Post;

    mockGetAllRoastDinnerPosts.mockResolvedValueOnce([sevenPointTwoPost]);

    const result = await getTubeLineRoastPosts(["Waterloo"], 7);

    expect(result).toEqual([sevenPointTwoPost]);
  });
});
