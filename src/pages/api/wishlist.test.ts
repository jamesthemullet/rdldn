import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockSelect, mockInsert } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock("../../lib/db", () => ({
  db: { select: mockSelect, insert: mockInsert },
}));

import { GET, POST } from "./wishlist";

const selectChain = (resolvedValue: unknown) => ({
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue(resolvedValue),
      orderBy: vi.fn().mockResolvedValue(resolvedValue),
    }),
  }),
});

const makeContext = (
  clerkId: string | null,
  body?: Record<string, unknown>
): APIContext =>
  ({
    locals: {
      auth: () => ({ userId: clerkId }),
    },
    request: new Request("http://localhost/api/wishlist", {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }),
  }) as unknown as APIContext;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/wishlist", () => {
  test("returns 401 when the request is not authenticated", async () => {
    const response = await GET(makeContext(null));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  test("returns an empty array when the user does not exist in the database", async () => {
    mockSelect.mockReturnValueOnce(selectChain([]));

    const response = await GET(makeContext("clerk_abc"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  test("returns wishlist items for an authenticated user", async () => {
    const items = [
      { id: "item-1", postSlug: "the-anchor", postTitle: "The Anchor", postRating: "8.5" },
    ];
    mockSelect
      .mockReturnValueOnce(selectChain([{ id: "user-uuid" }]))
      .mockReturnValueOnce(selectChain(items));

    const response = await GET(makeContext("clerk_abc"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(items);
  });
});

describe("POST /api/wishlist", () => {
  test("returns 400 when postSlug or postTitle is missing from the request body", async () => {
    const response = await POST(makeContext("clerk_abc", { postSlug: "", postTitle: "" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "postSlug and postTitle are required" });
  });

  test("returns 201 and saves the item when it does not already exist", async () => {
    mockSelect
      .mockReturnValueOnce(selectChain([{ id: "user-uuid" }]))
      .mockReturnValueOnce(selectChain([]));
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const response = await POST(
      makeContext("clerk_abc", {
        postSlug: "the-anchor",
        postTitle: "The Anchor",
        postRating: "8.5",
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ saved: true });
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });
});
