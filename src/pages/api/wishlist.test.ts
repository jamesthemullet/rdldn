import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

import { db } from "../../lib/db";
import { GET, POST } from "./wishlist";

function makeContext(clerkId: string | null, body?: Record<string, unknown>): APIContext {
  return {
    locals: { auth: () => ({ userId: clerkId }) },
    request: { json: () => Promise.resolve(body ?? {}) },
  } as unknown as APIContext;
}

function makeSelectChain(result: unknown[] = []) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
    orderBy: vi.fn().mockResolvedValue(result),
  };
}

describe("GET /api/wishlist", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when unauthenticated", async () => {
    const response = await GET(makeContext(null));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized");
  });

  test("returns empty array when user is not found in the database", async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectChain([]) as never);
    const response = await GET(makeContext("clerk_abc"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  test("returns wishlist items for the authenticated user", async () => {
    const items = [
      { id: "item-1", postSlug: "roast-one", postTitle: "Roast One", postRating: "8.5" },
    ];
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-uuid" }]) as never)
      .mockReturnValueOnce(makeSelectChain(items) as never);
    const response = await GET(makeContext("clerk_abc"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(items);
  });
});

describe("POST /api/wishlist", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when unauthenticated", async () => {
    const response = await POST(makeContext(null, { postSlug: "slug", postTitle: "Title" }));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized");
  });

  test("returns 400 when postSlug is missing", async () => {
    const response = await POST(makeContext("clerk_abc", { postTitle: "Title" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("required");
  });

  test("returns 400 when postTitle is missing", async () => {
    const response = await POST(makeContext("clerk_abc", { postSlug: "slug" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("required");
  });

  test("returns 200 when the wishlist item already exists", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-uuid" }]) as never)
      .mockReturnValueOnce(makeSelectChain([{ id: "existing-item" }]) as never);
    const response = await POST(makeContext("clerk_abc", { postSlug: "slug", postTitle: "Title" }));
    expect(response.status).toBe(200);
    expect((await response.json()).saved).toBe(true);
  });

  test("inserts a new wishlist item and returns 201", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-uuid" }]) as never)
      .mockReturnValueOnce(makeSelectChain([]) as never);
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    } as never);
    const response = await POST(makeContext("clerk_abc", { postSlug: "slug", postTitle: "Title", postRating: "9.0" }));
    expect(response.status).toBe(201);
    expect((await response.json()).saved).toBe(true);
  });

  test("creates a user record when the user is not found, then saves the item", async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectChain([]) as never);
    vi.mocked(db.insert)
      .mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "new-user-id" }]),
        }),
      } as never)
      .mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      } as never);
    const response = await POST(makeContext("clerk_abc", { postSlug: "slug", postTitle: "Title" }));
    expect(response.status).toBe(201);
    expect((await response.json()).saved).toBe(true);
  });
});
