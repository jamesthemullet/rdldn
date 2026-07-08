import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../lib/db", () => ({
  db: {
    select: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from "../../../lib/db";
import { DELETE } from "./[slug]";

function makeContext(clerkId: string | null, slug = "test-slug"): APIContext {
  return {
    locals: { auth: () => ({ userId: clerkId }) },
    params: { slug },
  } as unknown as APIContext;
}

function makeSelectChain(result: unknown[] = []) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

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
