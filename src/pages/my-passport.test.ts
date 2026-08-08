import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../components/header/HeaderAuth");

vi.mock("astro:assets", () => ({
  Image: (() => {
    type AstroImageComponent = ((
      _result: unknown,
      props: { src: string; alt?: string }
    ) => string) & { isAstroComponentFactory: boolean };

    const ImageComponent = ((
      _result: unknown,
      props: { src: string; alt?: string }
    ) => `<img src="${props.src}" alt="${props.alt ?? ""}" />`) as AstroImageComponent;

    ImageComponent.isAstroComponentFactory = true;
    return ImageComponent;
  })(),
}));

vi.mock("../lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

const getAllRoastDinnerPostsMock = vi.fn();
vi.mock("../lib/getAllRoastDinnerPosts", () => ({
  getAllRoastDinnerPosts: getAllRoastDinnerPostsMock,
}));

import { db } from "../lib/db";

function makeUserSelectChain(result: unknown[] = []) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

function makeVisitsSelectChain(result: unknown[] = []) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(result),
  };
}

describe("my-passport page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllRoastDinnerPostsMock.mockResolvedValue([]);
  });

  test("redirects to sign-in when not authenticated", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./my-passport.astro");

    const response = await container.renderToResponse(Page, {
      request: new Request("https://rdldn.co.uk/my-passport"),
      locals: { auth: () => ({ userId: null }) } as App.Locals,
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/sign-in");
  });

  test("shows zeroed stats and locked badges for a signed-in user with no visits", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeUserSelectChain([{ id: "user-uuid" }]) as never)
      .mockReturnValueOnce(makeVisitsSelectChain([]) as never);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./my-passport.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/my-passport"),
      locals: { auth: () => ({ userId: "clerk_abc" }) } as App.Locals,
    });

    expect(html).toContain("My Roast Dinner Passport");
    expect(html).toContain("First Roast");
    expect(html).toContain("Century Club");
    expect(html).not.toContain('badge--earned"');
  });

  test("shows earned badges and stats for a user with visits", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeUserSelectChain([{ id: "user-uuid" }]) as never)
      .mockReturnValueOnce(
        makeVisitsSelectChain([
          {
            id: "visit-1",
            userId: "user-uuid",
            postSlug: "great-roast",
            postTitle: "Great Roast",
            postRating: "9.2",
            visitedAt: new Date("2024-01-01"),
            notes: null,
          },
        ]) as never
      );
    getAllRoastDinnerPostsMock.mockResolvedValue([
      {
        slug: "great-roast",
        title: "Great Roast",
        date: "2024-01-01",
        zones: { nodes: [{ name: "Zone 1" }] },
        meats: { nodes: [{ name: "Beef" }] },
      },
    ]);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./my-passport.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/my-passport"),
      locals: { auth: () => ({ userId: "clerk_abc" }) } as App.Locals,
    });

    expect(html).toContain("1"); // total visits stat
    expect(html).toContain("Beef");
    expect(html).toContain("Great Roast");
    expect(html).toMatch(/badge--earned"[^>]*>\s*<span class="badge__name">First Roast/);
  });

  test("shows an error message when the database call fails", async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error("db down");
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./my-passport.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/my-passport"),
      locals: { auth: () => ({ userId: "clerk_abc" }) } as App.Locals,
    });

    expect(html).toContain("Sorry, we couldn't load your passport right now");
  });
});
