import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { db } from "../../../lib/db";
import { GET, POST } from "./personal-best";

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
  };
}

describe("GET /guessthescore/api/personal-best", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when unauthenticated", async () => {
    const response = await GET(makeContext(null));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized");
  });

  test("returns the stored personal best score for a known user", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-123" }]) as never)
      .mockReturnValueOnce(makeSelectChain([{ score: 42 }]) as never);

    const response = await GET(makeContext("clerk_abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.score).toBe(42);
  });

  test("returns null score when user is not in the database", async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectChain([]) as never);
    const response = await GET(makeContext("clerk_abc"));
    expect(response.status).toBe(200);
    expect((await response.json()).score).toBeNull();
  });
});

describe("POST /guessthescore/api/personal-best", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when unauthenticated", async () => {
    const response = await POST(makeContext(null, { score: 80 }));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized");
  });

  test("returns 400 for a score outside the valid range", async () => {
    const response = await POST(makeContext("clerk_abc", { score: 150 }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Invalid score");
  });

  test("does not update when the new score does not beat the existing personal best", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-123" }]) as never)
      .mockReturnValueOnce(makeSelectChain([{ id: "pb-1", score: 80 }]) as never);

    const response = await POST(makeContext("clerk_abc", { score: 60 }));
    const data = await response.json();

    expect(data.saved).toBe(false);
    expect(data.personalBest).toBe(80);
    expect(db.update).not.toHaveBeenCalled();
  });

  test("saves a new personal best when no previous record exists", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-123" }]) as never)
      .mockReturnValueOnce(makeSelectChain([]) as never);
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    } as never);

    const response = await POST(makeContext("clerk_abc", { score: 75 }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.saved).toBe(true);
    expect(data.personalBest).toBe(75);
  });
});
