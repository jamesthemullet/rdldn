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

describe("borough detail page", () => {
  test("getStaticPaths groups by borough, excludes boroughs with fewer than 2 posts, and sorts by rating descending", async () => {
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([
      {
        slug: "hackney-low",
        date: "2025-01-01T00:00:00.000Z",
        boroughs: { nodes: [{ name: "Hackney" }] },
        ratings: { nodes: [{ name: "6.0" }] },
      },
      {
        slug: "hackney-high",
        date: "2025-02-01T00:00:00.000Z",
        boroughs: { nodes: [{ name: "Hackney" }] },
        ratings: { nodes: [{ name: "9.0" }] },
      },
      {
        slug: "solo-borough",
        date: "2025-01-01T00:00:00.000Z",
        boroughs: { nodes: [{ name: "Solo Borough" }] },
        ratings: { nodes: [{ name: "8.0" }] },
      },
      {
        slug: "no-borough",
        date: "2025-01-01T00:00:00.000Z",
        ratings: { nodes: [{ name: "8.0" }] },
      },
    ] as Post[]);

    const pageModule = await import("./[borough].astro");
    const paths = (await pageModule.getStaticPaths()) as Array<{
      params: { borough: string };
      props: { boroughName: string; posts: Post[] };
    }>;

    const hackney = paths.find((entry) => entry.params.borough === "hackney");
    const solo = paths.find(
      (entry) => entry.params.borough === "solo-borough"
    );

    expect(hackney).toBeDefined();
    expect(solo).toBeUndefined();
    expect(hackney?.props.boroughName).toBe("Hackney");
    expect(hackney?.props.posts.map((post) => post.slug)).toEqual([
      "hackney-high",
      "hackney-low",
    ]);
  });

  test("renders borough summary, ranked list, and price when available", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./[borough].astro");

    const html = await container.renderToString(Page, {
      props: {
        boroughName: "Hackney",
        posts: [
          {
            slug: "hackney-high",
            title: "Hackney High",
            featuredImage: {
              node: { sourceUrl: "https://example.com/high.jpg", altText: "" },
            },
            ratings: { nodes: [{ name: "9.0" }] },
            prices: { nodes: [{ name: "£20" }] },
          },
          {
            slug: "hackney-low",
            title: "Hackney Low",
            featuredImage: {
              node: { sourceUrl: "https://example.com/low.jpg", altText: "" },
            },
            ratings: { nodes: [{ name: "7.0" }] },
            prices: { nodes: [{ name: "£30" }] },
          },
        ],
      },
    });

    expect(html).toContain("Best Roast Dinners in Hackney");
    expect(html).toContain("Reviews:</strong> 2");
    expect(html).toMatch(/Average rating:<\/strong>\s*8\.0\/10/);
    expect(html).toMatch(/Average price:<\/strong>\s*£25\.00/);
    expect(html).toContain('href="/hackney-high"');
    expect(html).toContain("#1");
    expect(html).toContain("#2");
    expect(html).toContain('href="/boroughs"');
  });

  test("omits average price when no posts have prices", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./[borough].astro");

    const html = await container.renderToString(Page, {
      props: {
        boroughName: "No Price Borough",
        posts: [
          {
            slug: "no-price",
            title: "No Price",
            featuredImage: {
              node: { sourceUrl: "https://example.com/np.jpg", altText: "" },
            },
            ratings: { nodes: [{ name: "7.0" }] },
          },
        ],
      },
    });

    expect(html).not.toContain("Average price:");
  });
});
