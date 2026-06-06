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

function makeSelectChain(result: unknown[]) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn().mockResolvedValue(result),
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

describe("GET /guessthescore/api/personal-best", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 401 when not authenticated", async () => {
    const response = await GET(makeContext(null));
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  test("returns the stored personal best score for a known user", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-123" }]))
      .mockReturnValueOnce(makeSelectChain([{ score: 42 }]));

    const response = await GET(makeContext("clerk-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.score).toBe(42);
  });
});

describe("POST /guessthescore/api/personal-best", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 401 when not authenticated", async () => {
    const response = await POST(makeContext(null, { score: 50 }));
    expect(response.status).toBe(401);
  });

  test("returns 400 for an out-of-range score", async () => {
    const response = await POST(makeContext("clerk-abc", { score: 101 }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid score");
  });

  test("does not update when the new score does not beat the existing personal best", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-123" }]))
      .mockReturnValueOnce(makeSelectChain([{ id: "pb-1", score: 80 }]));

    const response = await POST(makeContext("clerk-abc", { score: 60 }));
    const data = await response.json();

    expect(data.saved).toBe(false);
    expect(data.personalBest).toBe(80);
    expect(db.update).not.toHaveBeenCalled();
  });

  test("saves a new personal best when no previous record exists", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([{ id: "user-123" }]))
      .mockReturnValueOnce(makeSelectChain([]));
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof db.insert>);

    const response = await POST(makeContext("clerk-abc", { score: 75 }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.saved).toBe(true);
    expect(data.personalBest).toBe(75);
  });
});
