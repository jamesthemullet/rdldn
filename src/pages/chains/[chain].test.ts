import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getAllRoastDinnerPosts } from "../../lib/getAllRoastDinnerPosts";
import type { Post } from "../../types";

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

describe("chains detail page", () => {
  test("getStaticPaths groups by chain, excludes independent, and sorts posts by date descending", async () => {
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([
      {
        slug: "alpha-newer",
        date: "2025-03-01T00:00:00.000Z",
        owners: { nodes: [{ name: "Alpha & Co" }] },
        ratings: { nodes: [{ name: "8.0" }] },
      },
      {
        slug: "alpha-older",
        date: "2024-03-01T00:00:00.000Z",
        owners: { nodes: [{ name: "Alpha & Co" }] },
        ratings: { nodes: [{ name: "8.0" }] },
      },
      {
        slug: "alpha-high",
        date: "2020-03-01T00:00:00.000Z",
        owners: { nodes: [{ name: "Alpha & Co" }] },
        ratings: { nodes: [{ name: "9.5" }] },
      },
      {
        slug: "independent-post",
        date: "2025-02-02T00:00:00.000Z",
        owners: { nodes: [{ name: "Independent" }] },
        ratings: { nodes: [{ name: "10" }] },
      },
      {
        slug: "beta-post",
        date: "2025-01-01T00:00:00.000Z",
        owners: { nodes: [{ name: "Beta Group" }] },
        ratings: { nodes: [{ name: "7.0" }] },
      },
    ] as Post[]);

    const pageModule = await import("./[chain].astro");
    const paths = (await pageModule.getStaticPaths()) as Array<{
      params: { chain: string };
      props: { chainName: string; posts: Post[] };
    }>;

    const alpha = paths.find((entry) => entry.params.chain === "alpha-and-co");
    const beta = paths.find((entry) => entry.params.chain === "beta-group");
    const independent = paths.find((entry) => entry.params.chain === "independent");

    expect(alpha).toBeDefined();
    expect(beta).toBeDefined();
    expect(independent).toBeUndefined();
    expect(alpha?.props.chainName).toBe("Alpha & Co");
    expect(alpha?.props.posts.map((post) => post.slug)).toEqual([
      "alpha-newer",
      "alpha-older",
      "alpha-high",
    ]);
  });

  test("renders post metadata, closed status labels, and image alt fallback", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./[chain].astro");

    const html = await container.renderToString(Page, {
      props: {
        chainName: "Alpha & Co",
        posts: [
          {
            slug: "alpha-high",
            title: "Alpha High",
            featuredImage: {
              node: {
                sourceUrl: "https://example.com/alpha-high.jpg",
                altText: "",
              },
            },
            ratings: { nodes: [{ name: "9.8" }] },
            yearsOfVisit: { nodes: [{ name: "2025" }] },
            closedDowns: { nodes: [{ name: "re-reviewed-2026" }] },
          },
          {
            slug: "alpha-mid",
            title: "Alpha Mid",
            featuredImage: {
              node: {
                sourceUrl: "https://example.com/alpha-mid.jpg",
                altText: "Custom Alt",
              },
            },
            ratings: { nodes: [{ name: "" }] },
            yearsOfVisit: { nodes: [] },
            closedDowns: { nodes: [{ name: "tempclosed" }] },
          },
          {
            slug: "alpha-unknown",
            title: "Alpha Unknown",
            featuredImage: {
              node: {
                sourceUrl: "https://example.com/alpha-unknown.jpg",
                altText: "",
              },
            },
            ratings: { nodes: [{ name: "7.4" }] },
            yearsOfVisit: { nodes: [] },
            closedDowns: { nodes: [{ name: "unknownstatus" }] },
          },
        ],
      },
    });

    expect(html).toContain("Reviews of venues owned by Alpha &amp; Co");
    expect(html).toContain('href="/alpha-high"');
    expect(html).toMatch(/Rating:<\/strong>\s*9\.8/);
    expect(html).toMatch(/Year visited:<\/strong>\s*2025/);
    expect(html).toContain("Re-reviewed: 2026");
    expect(html).toContain("Temporarily Closed");
    expect(html).toContain("unknownstatus");
    expect(html).toContain('alt="Photo of the roast dinner at Alpha High"');
    expect(html).toContain('alt="Custom Alt"');
    expect(html).toMatch(/Rating:<\/strong>\s*N\/A/);
  });

  test("renders empty state when no posts are provided", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./[chain].astro");

    const html = await container.renderToString(Page, {
      props: {
        chainName: "No Chain",
        posts: [],
      },
    });

    expect(html).toContain("No reviews found for this chain.");
  });

  test("renders sort controls when posts are present", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./[chain].astro");

    const html = await container.renderToString(Page, {
      props: {
        chainName: "Alpha & Co",
        posts: [
          {
            slug: "alpha-a",
            title: "Alpha A",
            featuredImage: { node: { sourceUrl: "https://example.com/a.jpg", altText: "" } },
            ratings: { nodes: [{ name: "9.0" }] },
            date: "2025-01-01T00:00:00.000Z",
          },
        ],
      },
    });

    expect(html).toContain('id="sort-field"');
    expect(html).toContain('id="sort-direction"');
    expect(html).toContain('value="date"');
    expect(html).toContain('value="rating"');
    expect(html).toContain('value="desc"');
    expect(html).toContain('value="asc"');
    expect(html).toContain('data-date="2025-01-01T00:00:00.000Z"');
    expect(html).toContain('data-rating="9.0"');
  });

  test("does not render sort controls when no posts", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./[chain].astro");

    const html = await container.renderToString(Page, {
      props: { chainName: "No Chain", posts: [] },
    });

    expect(html).not.toContain('id="sort-field"');
  });

  test("renders average rating below the title", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./[chain].astro");

    const html = await container.renderToString(Page, {
      props: {
        chainName: "Alpha & Co",
        posts: [
          {
            slug: "alpha-a",
            title: "Alpha A",
            featuredImage: { node: { sourceUrl: "https://example.com/a.jpg", altText: "" } },
            ratings: { nodes: [{ name: "9.0" }] },
            date: "2025-01-01T00:00:00.000Z",
          },
          {
            slug: "alpha-b",
            title: "Alpha B",
            featuredImage: { node: { sourceUrl: "https://example.com/b.jpg", altText: "" } },
            ratings: { nodes: [{ name: "7.0" }] },
            date: "2024-01-01T00:00:00.000Z",
          },
        ],
      },
    });

    expect(html).toMatch(/Average rating:<\/strong>\s*8\.0/);
  });

  test("does not render average rating when no posts have ratings", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./[chain].astro");

    const html = await container.renderToString(Page, {
      props: {
        chainName: "No Ratings Chain",
        posts: [
          {
            slug: "no-rating",
            title: "No Rating",
            featuredImage: { node: { sourceUrl: "https://example.com/nr.jpg", altText: "" } },
            ratings: { nodes: [{ name: "" }] },
            date: "2025-01-01T00:00:00.000Z",
          },
        ],
      },
    });

    expect(html).not.toContain("Average rating:");
  });
});
