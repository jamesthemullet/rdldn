import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../lib/ratings", () => ({
  getAverageRating: vi.fn(),
}));

import { getAverageRating } from "../../../lib/ratings";
import { GET } from "./[slug]";

function makeContext(slug: string | undefined): APIContext {
  return { params: { slug } } as unknown as APIContext;
}

describe("GET /api/ratings/[slug]", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 400 when slug is missing", async () => {
    const response = await GET(makeContext(undefined));
    expect(response.status).toBe(400);
  });

  test("returns the rating summary for the slug", async () => {
    vi.mocked(getAverageRating).mockResolvedValue({ average: 8.2, count: 5 });
    const response = await GET(makeContext("some-slug"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ average: 8.2, count: 5 });
    expect(getAverageRating).toHaveBeenCalledWith("some-slug");
  });
});
