import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

import { db } from "../../lib/db";
import { GET, POST } from "./visits";

function makeContext(clerkId: string | null, body?: unknown): APIContext {
  return {
    locals: { auth: () => ({ userId: clerkId }) },
    request: { json: () => Promise.resolve(body) },
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

describe("GET /api/visits", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when unauthenticated", async () => {
    const response = await GET(makeContext(null));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized");
  });

  test("returns an empty list when user is not in the database", async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectChain([]) as never);
    const response = await GET(makeContext("clerk_abc"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  test("returns the user's visits", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-uuid" }]) as never)
      .mockReturnValueOnce(makeSelectChain([{ postSlug: "some-post-slug" }]) as never);

    const response = await GET(makeContext("clerk_abc"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ postSlug: "some-post-slug" }]);
  });
});

describe("POST /api/visits", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when unauthenticated", async () => {
    const response = await POST(makeContext(null, { postSlug: "a", postTitle: "A" }));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized");
  });

  test("returns 400 when postSlug or postTitle is missing", async () => {
    const response = await POST(makeContext("clerk_abc", { postSlug: "a" }));
    expect(response.status).toBe(400);
  });

  test("creates a new user and logs the visit and returns 201", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([]) as never)
      .mockReturnValueOnce(makeSelectChain([]) as never);
    vi.mocked(db.insert)
      .mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "new-user-uuid" }]),
        }),
      } as never)
      .mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      } as never);

    const response = await POST(makeContext("clerk_abc", { postSlug: "some-post-slug", postTitle: "Some Post" }));
    expect(response.status).toBe(201);
    expect((await response.json()).visited).toBe(true);
  });

  test("returns 200 without inserting when the visit already exists", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-uuid" }]) as never)
      .mockReturnValueOnce(makeSelectChain([{ id: "visit-uuid" }]) as never);

    const response = await POST(makeContext("clerk_abc", { postSlug: "some-post-slug", postTitle: "Some Post" }));
    expect(response.status).toBe(200);
    expect((await response.json()).visited).toBe(true);
    expect(db.insert).not.toHaveBeenCalled();
  });
});
