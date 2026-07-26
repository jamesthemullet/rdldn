import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("../../../lib/getAllRoastDinnerPosts", () => ({
  getAllRoastDinnerPosts: vi.fn(),
}));

import { BADGES } from "../../../lib/badges";
import { db } from "../../../lib/db";
import { getAllRoastDinnerPosts } from "../../../lib/getAllRoastDinnerPosts";
import { GET } from "./badges";

function makeContext(clerkId: string | null): APIContext {
  return {
    locals: { auth: () => ({ userId: clerkId }) },
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

describe("GET /api/passport/badges", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when unauthenticated", async () => {
    const response = await GET(makeContext(null));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized");
  });

  test("returns no earned badges when the user is not in the database", async () => {
    vi.mocked(db.select).mockReturnValue(makeUserSelectChain([]) as never);

    const response = await GET(makeContext("clerk_abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.badges).toEqual([]);
    expect(data.totalBadges).toBe(BADGES.length);
    expect(getAllRoastDinnerPosts).not.toHaveBeenCalled();
  });

  test("returns earned badges computed from the user's visits", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeUserSelectChain([{ id: "user-uuid" }]) as never)
      .mockReturnValueOnce(
        makeVisitsSelectChain([{ postSlug: "some-slug", postTitle: "Some Post" }]) as never
      );
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([{ slug: "some-slug" } as never]);

    const response = await GET(makeContext("clerk_abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalBadges).toBe(BADGES.length);
    expect(data.badges.map((b: { key: string }) => b.key)).toContain("first-roast");
  });

  test("returns no earned badges when the user has no visits", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeUserSelectChain([{ id: "user-uuid" }]) as never)
      .mockReturnValueOnce(makeVisitsSelectChain([]) as never);
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([]);

    const response = await GET(makeContext("clerk_abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.badges).toEqual([]);
  });
});
