import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../lib/passportLeaderboard", () => ({
  getLeaderboardEntries: vi.fn(),
}));

import { getLeaderboardEntries } from "../../../lib/passportLeaderboard";
import { GET } from "./leaderboard";

describe("GET /api/passport/leaderboard", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns the ranked entries as JSON", async () => {
    vi.mocked(getLeaderboardEntries).mockResolvedValue([
      { displayName: "Alice", visits: 5, badges: 2 },
    ]);

    const response = await GET({} as unknown as APIContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(data).toEqual([{ displayName: "Alice", visits: 5, badges: 2 }]);
  });

  test("returns an empty array when nobody has opted in", async () => {
    vi.mocked(getLeaderboardEntries).mockResolvedValue([]);

    const response = await GET({} as unknown as APIContext);
    const data = await response.json();

    expect(data).toEqual([]);
  });
});
