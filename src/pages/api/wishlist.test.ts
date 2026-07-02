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

function makeSelectChain(result: unknown[]) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn().mockResolvedValue(result),
    orderBy: vi.fn().mockResolvedValue(result),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  return chain as unknown as ReturnType<typeof db.select>;
}

function makeContext(clerkId: string | null, body?: unknown): APIContext {
  return {
    locals: {
      auth: () => ({ userId: clerkId }),
    },
    request: {
      json: () => Promise.resolve(body),
    },
  } as unknown as APIContext;
}

describe("GET /api/wishlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 401 when not authenticated", async () => {
    const response = await GET(makeContext(null));
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  test("returns saved wishlist items for an authenticated user", async () => {
    const items = [
      { id: "item-1", postSlug: "the-anchor", postTitle: "The Anchor", postRating: "8.5" },
    ];
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-123" }]))
      .mockReturnValueOnce(makeSelectChain(items));

    const response = await GET(makeContext("clerk-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(items);
  });
});

describe("POST /api/wishlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 400 when postSlug is missing from the request body", async () => {
    const response = await POST(makeContext("clerk-abc", { postTitle: "The Anchor" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("postSlug and postTitle are required");
  });

  test("returns saved:true without inserting when the item is already in the wishlist", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-123" }]))
      .mockReturnValueOnce(makeSelectChain([{ id: "item-1" }]));

    const response = await POST(makeContext("clerk-abc", { postSlug: "the-anchor", postTitle: "The Anchor" }));
    const data = await response.json();

    expect(data.saved).toBe(true);
    expect(db.insert).not.toHaveBeenCalled();
  });
});
