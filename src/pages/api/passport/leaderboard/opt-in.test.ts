import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../../lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../../../../lib/getAllRoastDinnerPosts", () => ({
  getAllRoastDinnerPosts: vi.fn(),
}));

vi.mock("../../../../lib/passportLeaderboard", () => ({
  removeLeaderboardEntry: vi.fn(),
  sanitizeDisplayName: vi.fn((name: unknown) =>
    typeof name === "string" && name.trim().length > 0 ? name.trim().slice(0, 30) : null
  ),
  setLeaderboardEntry: vi.fn(),
}));

import { db } from "../../../../lib/db";
import { getAllRoastDinnerPosts } from "../../../../lib/getAllRoastDinnerPosts";
import { removeLeaderboardEntry, setLeaderboardEntry } from "../../../../lib/passportLeaderboard";
import { POST } from "./opt-in";

function makeContext(clerkId: string | null, body: unknown): APIContext {
  return {
    locals: { auth: () => ({ userId: clerkId }) },
    request: { json: () => Promise.resolve(body) },
  } as unknown as APIContext;
}

function makeUserSelectChain(result: unknown[] = []) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

function makeVisitsSelectChain(result: unknown[] = []) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(result),
  };
}

function makeUpdateChain() {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
}

describe("POST /api/passport/leaderboard/opt-in", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when unauthenticated", async () => {
    const response = await POST(makeContext(null, { optIn: true, displayName: "Alice" }));
    expect(response.status).toBe(401);
  });

  test("returns 400 for an invalid request body", async () => {
    const response = await POST({
      locals: { auth: () => ({ userId: "clerk_abc" }) },
      request: { json: () => Promise.reject(new Error("bad json")) },
    } as unknown as APIContext);
    expect(response.status).toBe(400);
  });

  test("returns 400 when optIn is not a boolean", async () => {
    const response = await POST(makeContext("clerk_abc", { optIn: "yes" }));
    expect(response.status).toBe(400);
  });

  test("returns 404 when the user is not found", async () => {
    vi.mocked(db.select).mockReturnValue(makeUserSelectChain([]) as never);

    const response = await POST(makeContext("clerk_abc", { optIn: true, displayName: "Alice" }));
    expect(response.status).toBe(404);
  });

  test("opts out, updates the user and removes the leaderboard entry", async () => {
    vi.mocked(db.select).mockReturnValue(makeUserSelectChain([{ id: "user-uuid" }]) as never);
    vi.mocked(db.update).mockReturnValue(makeUpdateChain() as never);

    const response = await POST(makeContext("clerk_abc", { optIn: false }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ optedIn: false });
    expect(removeLeaderboardEntry).toHaveBeenCalledWith("user-uuid");
  });

  test("returns 400 when opting in without a usable display name", async () => {
    vi.mocked(db.select).mockReturnValue(makeUserSelectChain([{ id: "user-uuid" }]) as never);

    const response = await POST(makeContext("clerk_abc", { optIn: true, displayName: "   " }));
    expect(response.status).toBe(400);
    expect(setLeaderboardEntry).not.toHaveBeenCalled();
  });

  test("opts in, computes stats and writes the leaderboard entry", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeUserSelectChain([{ id: "user-uuid" }]) as never)
      .mockReturnValueOnce(makeVisitsSelectChain([{ postSlug: "some-slug" }, { postSlug: "other-slug" }]) as never);
    vi.mocked(db.update).mockReturnValue(makeUpdateChain() as never);
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([]);

    const response = await POST(makeContext("clerk_abc", { optIn: true, displayName: "Alice" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ optedIn: true, displayName: "Alice" });
    expect(setLeaderboardEntry).toHaveBeenCalledWith(
      "user-uuid",
      expect.objectContaining({ displayName: "Alice", visits: 2 })
    );
  });
});
