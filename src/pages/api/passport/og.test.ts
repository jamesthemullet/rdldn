import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { imageResponseMock } = vi.hoisted(() => ({
  imageResponseMock: vi.fn(function ImageResponseMock(
    _element?: unknown,
    _options?: { width: number; height: number }
  ) {
    return new Response("fake-image", { status: 200, headers: { "Content-Type": "image/png" } });
  }),
}));

vi.mock("@vercel/og", () => ({
  ImageResponse: imageResponseMock,
}));

import { BADGES } from "../../../lib/badges";
import { GET } from "./og";

function makeContext(url: string): APIContext {
  return { url: new URL(url) } as unknown as APIContext;
}

describe("GET /api/passport/og", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a 1200x630 image response sized for social sharing", async () => {
    const response = await GET(
      makeContext("https://rdldn.co.uk/api/passport/og?visits=5&zones=2&badges=3&meat=Beef")
    );

    expect(response.status).toBe(200);
    expect(imageResponseMock).toHaveBeenCalledTimes(1);
    const [, options] = imageResponseMock.mock.calls[0];
    expect(options).toEqual({
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=31536000" },
    });
  });

  it("bakes the parsed stats into the rendered element tree", async () => {
    await GET(makeContext("https://rdldn.co.uk/api/passport/og?visits=5&zones=2&badges=3&meat=Beef"));

    const [element] = imageResponseMock.mock.calls[0];
    const serialized = JSON.stringify(element);

    expect(serialized).toContain("5");
    expect(serialized).toContain("2");
    expect(serialized).toContain("3");
    expect(serialized).toContain("Beef");
  });

  it("renders default zeroed stats when no query params are provided", async () => {
    await GET(makeContext("https://rdldn.co.uk/api/passport/og"));

    const [element] = imageResponseMock.mock.calls[0];
    const serialized = JSON.stringify(element);

    expect(serialized).not.toContain("Favourite Meat");
    expect(serialized).toContain(`[0,"/",${BADGES.length}]`);
  });
});
