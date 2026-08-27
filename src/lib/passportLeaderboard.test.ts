import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("./kv", () => ({
  kv: {
    zadd: vi.fn(),
    zrem: vi.fn(),
    zremrangebyrank: vi.fn(),
    zrange: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
}));

import { kv } from "./kv";
import {
  getLeaderboardEntries,
  LEADERBOARD_KEY,
  removeLeaderboardEntry,
  sanitizeDisplayName,
  setLeaderboardEntry,
} from "./passportLeaderboard";

describe("sanitizeDisplayName", () => {
  test("trims whitespace", () => {
    expect(sanitizeDisplayName("  Lord Gravy  ")).toBe("Lord Gravy");
  });

  test("returns null for non-string input", () => {
    expect(sanitizeDisplayName(123)).toBeNull();
    expect(sanitizeDisplayName(undefined)).toBeNull();
    expect(sanitizeDisplayName(null)).toBeNull();
  });

  test("returns null for empty or whitespace-only strings", () => {
    expect(sanitizeDisplayName("")).toBeNull();
    expect(sanitizeDisplayName("   ")).toBeNull();
  });

  test("caps length at 30 characters", () => {
    const long = "a".repeat(50);
    expect(sanitizeDisplayName(long)).toBe("a".repeat(30));
  });
});

describe("setLeaderboardEntry", () => {
  beforeEach(() => vi.clearAllMocks());

  test("writes the score, member and meta, then trims the sorted set", async () => {
    await setLeaderboardEntry("user-1", { displayName: "Alice", visits: 5, badges: 2 });

    expect(kv.zadd).toHaveBeenCalledWith(LEADERBOARD_KEY, { score: 5, member: "user-1" });
    expect(kv.set).toHaveBeenCalledWith(`${LEADERBOARD_KEY}-meta:user-1`, {
      displayName: "Alice",
      visits: 5,
      badges: 2,
    });
    expect(kv.zremrangebyrank).toHaveBeenCalledWith(LEADERBOARD_KEY, 0, -101);
  });
});

describe("removeLeaderboardEntry", () => {
  beforeEach(() => vi.clearAllMocks());

  test("removes the member and its meta", async () => {
    await removeLeaderboardEntry("user-1");

    expect(kv.zrem).toHaveBeenCalledWith(LEADERBOARD_KEY, "user-1");
    expect(kv.del).toHaveBeenCalledWith(`${LEADERBOARD_KEY}-meta:user-1`);
  });
});

describe("getLeaderboardEntries", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns an empty array when the leaderboard is empty", async () => {
    vi.mocked(kv.zrange).mockResolvedValue([]);

    const entries = await getLeaderboardEntries();

    expect(entries).toEqual([]);
    expect(kv.get).not.toHaveBeenCalled();
  });

  test("resolves meta for each ranked member", async () => {
    vi.mocked(kv.zrange).mockResolvedValue(["user-1", "user-2"]);
    vi.mocked(kv.get)
      .mockResolvedValueOnce({ displayName: "Alice", visits: 5, badges: 2 })
      .mockResolvedValueOnce({ displayName: "Bob", visits: 3, badges: 1 });

    const entries = await getLeaderboardEntries();

    expect(entries).toEqual([
      { displayName: "Alice", visits: 5, badges: 2 },
      { displayName: "Bob", visits: 3, badges: 1 },
    ]);
    expect(kv.zrange).toHaveBeenCalledWith(LEADERBOARD_KEY, 0, 9, { rev: true });
  });

  test("filters out members with missing meta", async () => {
    vi.mocked(kv.zrange).mockResolvedValue(["user-1", "user-2"]);
    vi.mocked(kv.get)
      .mockResolvedValueOnce({ displayName: "Alice", visits: 5, badges: 2 })
      .mockResolvedValueOnce(null);

    const entries = await getLeaderboardEntries();

    expect(entries).toEqual([{ displayName: "Alice", visits: 5, badges: 2 }]);
  });

  test("returns an empty array when KV throws", async () => {
    vi.mocked(kv.zrange).mockRejectedValue(new Error("KV connection failed"));

    const entries = await getLeaderboardEntries();

    expect(entries).toEqual([]);
  });
});
