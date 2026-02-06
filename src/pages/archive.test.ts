import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchPostsByDate } from "../lib/graphql";

vi.mock("../lib/graphql", () => ({
  fetchPostsByDate: vi.fn()
}));

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("archive page", () => {
  test("defaults to current month when date query missing", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T00:00:00.000Z"));

    const mockedFetchPostsByDate = vi.mocked(fetchPostsByDate);
    mockedFetchPostsByDate.mockResolvedValue([]);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./archive.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/archive")
    });

    expect(fetchPostsByDate).toHaveBeenCalledWith("2026-02");
    expect(html).toMatch(/value="2026-02"[^>]*selected/);
  });

  test("uses query date, renders empty state, and skips Feb 2017", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T00:00:00.000Z"));

    const mockedFetchPostsByDate = vi.mocked(fetchPostsByDate);
    mockedFetchPostsByDate.mockResolvedValue([]);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./archive.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/archive?date=2024-03")
    });

    expect(fetchPostsByDate).toHaveBeenCalledWith("2024-03");
    expect(html).toContain("No posts found for the selected date.");
    expect(html).toMatch(/value="2024-03"[^>]*selected/);
    expect(html).not.toContain("value=\"2017-02\"");
  });

  test("renders posts list with links and image fallbacks", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T00:00:00.000Z"));

    const mockedFetchPostsByDate = vi.mocked(fetchPostsByDate);
    mockedFetchPostsByDate.mockResolvedValue([
      {
        slug: "best-roast-1",
        title: "First Roast",
        featuredImage: {
          node: {
            sourceUrl: "https://example.com/roast-1.jpg",
            altText: "First Roast Alt"
          }
        }
      },
      {
        slug: "best-roast-2",
        title: "Second Roast",
        featuredImage: {
          node: {
            sourceUrl: "https://example.com/roast-2.jpg",
            altText: ""
          }
        }
      }
    ]);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./archive.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/archive?date=2025-01")
    });

    expect(fetchPostsByDate).toHaveBeenCalledWith("2025-01");
    expect(html).toContain("First Roast");
    expect(html).toContain("Second Roast");
    expect(html).toContain("href=\"/best-roast-1\"");
    expect(html).toContain("href=\"/best-roast-2\"");
    expect(html).toContain("src=\"https://example.com/roast-1.jpg\"");
    expect(html).toContain("alt=\"First Roast Alt\"");
    expect(html).toContain("alt=\"Photo of the roast dinner at Second Roast\"");
  });
});
