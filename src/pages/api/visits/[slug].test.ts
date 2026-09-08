import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from "../../../lib/db";
import { DELETE, PATCH } from "./[slug]";

function makeContext(clerkId: string | null, slug = "test-slug", body?: unknown): APIContext {
  return {
    locals: { auth: () => ({ userId: clerkId }) },
    params: { slug },
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

describe("PATCH /api/visits/[slug]", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when unauthenticated", async () => {
    const response = await PATCH(makeContext(null, "test-slug", { userRating: 8 }));
    expect(response.status).toBe(401);
  });

  test("returns 400 when userRating is out of range", async () => {
    const response = await PATCH(makeContext("clerk_abc", "test-slug", { userRating: 11 }));
    expect(response.status).toBe(400);
  });

  test("returns 400 when userRating is not a number", async () => {
    const response = await PATCH(makeContext("clerk_abc", "test-slug", { userRating: "great" }));
    expect(response.status).toBe(400);
  });

  test("returns 404 when the user is not found", async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectChain([]) as never);
    const response = await PATCH(makeContext("clerk_abc", "test-slug", { userRating: 8 }));
    expect(response.status).toBe(404);
  });

  test("returns 404 when the visit does not exist", async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectChain([{ id: "user-uuid" }]) as never);
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as never);

    const response = await PATCH(makeContext("clerk_abc", "test-slug", { userRating: 8 }));
    expect(response.status).toBe(404);
  });

  test("updates the rating and returns 200", async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectChain([{ id: "user-uuid" }]) as never);
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "visit-uuid" }]),
        }),
      }),
    } as never);

    const response = await PATCH(makeContext("clerk_abc", "test-slug", { userRating: 8 }));
    expect(response.status).toBe(200);
    expect((await response.json()).userRating).toBe(8);
  });
});

describe("DELETE /api/visits/[slug]", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when unauthenticated", async () => {
    const response = await DELETE(makeContext(null));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized");
  });

  test("returns 404 when the user is not found in the database", async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectChain([]) as never);
    const response = await DELETE(makeContext("clerk_abc", "some-post-slug"));
    expect(response.status).toBe(404);
  });

  test("deletes the visit and returns 204", async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectChain([{ id: "user-uuid" }]) as never);
    vi.mocked(db.delete).mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    } as never);

    const response = await DELETE(makeContext("clerk_abc", "some-post-slug"));
    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });
});
