import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getAllRoastDinnerPosts } from "../../lib/getAllRoastDinnerPosts";
import type { Post } from "../../types";

vi.mock("../../components/header/HeaderAuth");

vi.mock("../../lib/getAllRoastDinnerPosts", () => ({
  getAllRoastDinnerPosts: vi.fn(),
}));

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  ),
}));

beforeEach(() => {
  vi.resetModules();
  vi.mocked(getAllRoastDinnerPosts).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("boroughs hub page", () => {
  test("renders every borough with review count, average rating, and average price", async () => {
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([
      {
        slug: "hackney-1",
        boroughs: { nodes: [{ name: "Hackney" }] },
        ratings: { nodes: [{ name: "8.0" }] },
        prices: { nodes: [{ name: "£20" }] },
      },
      {
        slug: "hackney-2",
        boroughs: { nodes: [{ name: "Hackney" }] },
        ratings: { nodes: [{ name: "6.0" }] },
        prices: { nodes: [{ name: "£30" }] },
      },
      {
        slug: "solo-borough",
        boroughs: { nodes: [{ name: "Solo Borough" }] },
        ratings: { nodes: [{ name: "9.0" }] },
      },
      {
        slug: "no-borough",
        ratings: { nodes: [{ name: "8.0" }] },
      },
      {
        slug: "na-borough",
        boroughs: { nodes: [{ name: "N/A" }] },
        ratings: { nodes: [{ name: "5.0" }] },
      },
      {
        slug: "hackney-closed",
        boroughs: { nodes: [{ name: "Hackney" }] },
        ratings: { nodes: [{ name: "1.0" }] },
        prices: { nodes: [{ name: "£1" }] },
        closedDowns: { nodes: [{ name: "closeddown" }] },
      },
    ] as Post[]);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");

    const html = await container.renderToString(Page, {});

    expect(html).toContain("Best Roast Dinners by Borough");
    expect(html).toContain('href="/boroughs/hackney"');
    expect(html).toMatch(/Hackney[\s\S]*?2[\s\S]*?7\.00[\s\S]*?£25\.00/);
    expect(html).toContain("Solo Borough");
    expect(html).not.toContain('href="/boroughs/solo-borough"');
    expect(html).not.toMatch(/data-name="N\/A"/i);
  });

  test("renders sort controls when boroughs are present", async () => {
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([
      {
        slug: "hackney-1",
        boroughs: { nodes: [{ name: "Hackney" }] },
        ratings: { nodes: [{ name: "8.0" }] },
      },
    ] as Post[]);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");

    const html = await container.renderToString(Page, {});

    expect(html).toContain('id="sort-field"');
    expect(html).toContain('id="sort-direction"');
  });

  test("does not render sort controls when there are no boroughs", async () => {
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([]);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");

    const html = await container.renderToString(Page, {});

    expect(html).not.toContain('id="sort-field"');
  });
});
