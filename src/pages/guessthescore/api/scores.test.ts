import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../lib/kv", () => ({
  kv: {
    zrange: vi.fn(),
  },
}));

import { kv } from "../../../lib/kv";
import { GET } from "./scores";

describe("GET /guessthescore/api/scores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns JSON array when members are JSON strings", async () => {
    const entries = [
      JSON.stringify({ name: "Alice", score: 90, date: "2026-01-01T00:00:00.000Z" }),
      JSON.stringify({ name: "Bob", score: 80, date: "2026-01-02T00:00:00.000Z" }),
    ];
    vi.mocked(kv.zrange).mockResolvedValue(entries as string[]);

    const response = await GET({} as unknown as APIContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(data).toEqual([
      { name: "Alice", score: 90, date: "2026-01-01T00:00:00.000Z" },
      { name: "Bob", score: 80, date: "2026-01-02T00:00:00.000Z" },
    ]);
  });

  test("returns scores when members are already objects", async () => {
    const entries = [{ name: "Alice", score: 90, date: "2026-01-01T00:00:00.000Z" }];
    vi.mocked(kv.zrange).mockResolvedValue(entries as unknown as string[]);

    const response = await GET({} as unknown as APIContext);
    const data = await response.json();

    expect(data).toEqual([{ name: "Alice", score: 90, date: "2026-01-01T00:00:00.000Z" }]);
  });

  test("skips members that are invalid JSON strings", async () => {
    const entries = [
      "not-valid-json",
      JSON.stringify({ name: "Bob", score: 70, date: "2026-01-01T00:00:00.000Z" }),
    ];
    vi.mocked(kv.zrange).mockResolvedValue(entries as string[]);

    const response = await GET({} as unknown as APIContext);
    const data = await response.json();

    expect(data).toEqual([{ name: "Bob", score: 70, date: "2026-01-01T00:00:00.000Z" }]);
  });

  test("returns empty array when leaderboard is empty", async () => {
    vi.mocked(kv.zrange).mockResolvedValue([]);

    const response = await GET({} as unknown as APIContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  test("returns empty array when KV throws", async () => {
    vi.mocked(kv.zrange).mockRejectedValue(new Error("KV connection failed"));

    const response = await GET({} as unknown as APIContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  test("queries leaderboard top 10 in reverse order", async () => {
    vi.mocked(kv.zrange).mockResolvedValue([]);

    await GET({} as unknown as APIContext);

    expect(kv.zrange).toHaveBeenCalledWith("leaderboard", 0, 9, { rev: true });
  });
});
