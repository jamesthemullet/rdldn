import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const getSinglePageDataMock = vi.fn();
const getAllRoastDinnerPostsMock = vi.fn();

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: getSinglePageDataMock
}));

vi.mock("../lib/getAllRoastDinnerPosts", () => ({
  getAllRoastDinnerPosts: getAllRoastDinnerPostsMock
}));

vi.mock("../lib/api", () => ({
  fetchGraphQL: vi.fn()
}));

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  )
}));

beforeEach(() => {
  getSinglePageDataMock.mockReset();
  getAllRoastDinnerPostsMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("roast-dinners-at-the-top-50-gastropubs-2025 page", () => {
  test("renders only qualifying Top 50 gastropub roast posts in rating order", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T00:00:00.000Z"));

    getSinglePageDataMock.mockResolvedValue({
      id: "page-gastro-2025",
      pageId: "9889",
      slug: "roast-dinners-at-the-top-50-gastropubs-2025",
      title: "Roast Dinners At The Top 50 Gastropubs 2025",
      content: "<p>Best roast dinners from the 2025 Top 50 gastropubs list.</p>",
      featuredImage: {
        node: {
          sourceUrl: "https://example.com/gastropubs-2025-hero.jpg"
        }
      },
      comments: { nodes: [] },
      seo: {
        opengraphDescription: "Top 50 gastropub roast picks for 2025.",
        opengraphImage: { sourceUrl: "https://example.com/gastropubs-2025-og.jpg" }
      }
    });

    getAllRoastDinnerPostsMock.mockResolvedValue([
      {
        title: "Top Gastropub Roast",
        slug: "top-gastropub-roast",
        typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
        features: { nodes: [{ name: "top-50-gastropub-2025" }] },
        ratings: { nodes: [{ name: "9.4" }] },
        closedDowns: { nodes: [] },
        highlights: { loved: "Perfectly pink beef", loathed: "Nothing" },
        yearsOfVisit: { nodes: [{ name: "2025" }] },
        featuredImage: { node: { sourceUrl: "https://example.com/post-1.jpg", altText: "Post 1" } }
      },
      {
        title: "Second Gastropub Roast",
        slug: "second-gastropub-roast",
        typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
        features: { nodes: [{ name: "top-50-gastropub-2025" }] },
        ratings: { nodes: [{ name: "8.7" }] },
        closedDowns: { nodes: [] },
        highlights: { loved: "Great gravy", loathed: "Dry carrots" },
        yearsOfVisit: { nodes: [{ name: "2025" }] },
        featuredImage: { node: { sourceUrl: "https://example.com/post-2.jpg", altText: "Post 2" } }
      },
      {
        title: "Wrong Feature",
        slug: "wrong-feature",
        typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
        features: { nodes: [{ name: "michelin-star" }] },
        ratings: { nodes: [{ name: "9.9" }] },
        closedDowns: { nodes: [] }
      },
      {
        title: "Closed Entry",
        slug: "closed-entry",
        typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
        features: { nodes: [{ name: "top-50-gastropub-2025" }] },
        ratings: { nodes: [{ name: "9.9" }] },
        closedDowns: { nodes: [{ name: "closed" }] }
      },
      {
        title: "Not A Roast",
        slug: "not-a-roast",
        typesOfPost: { nodes: [{ name: "Guide" }] },
        features: { nodes: [{ name: "top-50-gastropub-2025" }] },
        ratings: { nodes: [{ name: "9.8" }] },
        closedDowns: { nodes: [] }
      },
      {
        title: "Bad Rating",
        slug: "bad-rating",
        typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
        features: { nodes: [{ name: "top-50-gastropub-2025" }] },
        ratings: { nodes: [{ name: "not-a-number" }] },
        closedDowns: { nodes: [] }
      }
    ]);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./roast-dinners-at-the-top-50-gastropubs-2025.astro");
    const html = await container.renderToString(Page);

    expect(getSinglePageDataMock).toHaveBeenCalledWith({ variables: { id: "9889" } });
    expect(getAllRoastDinnerPostsMock).toHaveBeenCalledTimes(1);

    expect(html).toContain("Roast Dinners At The Top 50 Gastropubs 2025");
    expect(html).toContain("Best roast dinners from the 2025 Top 50 gastropubs list.");

    expect(html).toContain("Top Gastropub Roast");
    expect(html).toContain("Second Gastropub Roast");
    expect(html).not.toContain("Wrong Feature");
    expect(html).not.toContain("Closed Entry");
    expect(html).not.toContain("Not A Roast");
    expect(html).not.toContain("Bad Rating");

    const topIndex = html.indexOf("Top Gastropub Roast");
    const secondIndex = html.indexOf("Second Gastropub Roast");
    expect(topIndex).toBeGreaterThan(-1);
    expect(secondIndex).toBeGreaterThan(-1);
    expect(topIndex).toBeLessThan(secondIndex);

    expect(html).toContain("Have you had a roast dinner at any of the Top 50 Gastropubs?");
    expect(html).toContain("Get new roast reviews direct to your inbox");
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners in London/);
  });

  test("falls back to logo image when page featured image is missing", async () => {
    getSinglePageDataMock.mockResolvedValue({
      id: "page-gastro-2025",
      pageId: "9889",
      slug: "roast-dinners-at-the-top-50-gastropubs-2025",
      title: "Roast Dinners At The Top 50 Gastropubs 2025",
      content: "<p>Best roast dinners from the 2025 Top 50 gastropubs list.</p>",
      featuredImage: null,
      comments: { nodes: [] },
      seo: {
        opengraphDescription: "Top 50 gastropub roast picks for 2025.",
        opengraphImage: { sourceUrl: "https://example.com/gastropubs-2025-og.jpg" }
      }
    });

    getAllRoastDinnerPostsMock.mockResolvedValue([]);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./roast-dinners-at-the-top-50-gastropubs-2025.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Roast Dinners At The Top 50 Gastropubs 2025");
    expect(html).toContain('class="image-container"');
    expect(html).not.toContain("https://example.com/gastropubs-2025-hero.jpg");
  });
});
