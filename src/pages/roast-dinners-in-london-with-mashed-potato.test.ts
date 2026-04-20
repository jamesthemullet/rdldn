import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();
const getSinglePageDataMock = vi.fn();

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock
}));

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: getSinglePageDataMock
}));

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  )
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  getSinglePageDataMock.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("roast-dinners-in-london-with-mashed-potato page", () => {
  test("fetches paginated mashed potato posts and renders top 5 roast dinners by rating", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T00:00:00.000Z"));

    getSinglePageDataMock.mockResolvedValue({
      id: "page-mash",
      pageId: "7041",
      slug: "roast-dinners-in-london-with-mashed-potato",
      title: "Roast Dinners in London with Mashed Potato",
      content: "<p>Our favourite mashed potato roasts in London.</p>",
      featuredImage: { node: { sourceUrl: "https://example.com/mash-hero.jpg" } },
      comments: { nodes: [] },
      seo: {
        opengraphDescription: "The best mashed potato roast dinners.",
        opengraphImage: { sourceUrl: "https://example.com/mash-og.jpg" }
      }
    });

    fetchGraphQLMock.mockImplementation(async (_query: string, variables: Record<string, unknown>) => {
      if (!variables.after) {
        return {
          posts: {
            nodes: [
              {
                title: "Mash Supreme",
                slug: "mash-supreme",
                highlights: { loved: "Cloud-like mash", loathed: "Nothing" },
                ratings: { nodes: [{ name: "9.8" }] },
                yearsOfVisit: { nodes: [{ name: "2025" }] },
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
                closedDowns: { nodes: [] },
                featuredImage: { node: { sourceUrl: "https://example.com/a.jpg", altText: "A" } }
              },
              {
                title: "Guide Only",
                slug: "guide-only",
                ratings: { nodes: [{ name: "9.9" }] },
                typesOfPost: { nodes: [{ name: "Guide" }] },
                closedDowns: { nodes: [] }
              },
              {
                title: "Temporarily Closed Roast",
                slug: "temporarily-closed-roast",
                ratings: { nodes: [{ name: "8.8" }] },
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
                closedDowns: { nodes: [{ name: "Temporarily Closed" }] }
              },
              {
                title: "Buttery Mash",
                slug: "buttery-mash",
                highlights: { loved: "Loads of butter", loathed: "Tiny portion" },
                ratings: { nodes: [{ name: "7.5" }] },
                yearsOfVisit: { nodes: [{ name: "2024" }] },
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
                closedDowns: { nodes: [] }
              }
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: "cursor-1"
            }
          }
        };
      }

      return {
        posts: {
          nodes: [
            {
              title: "Potato Whisperer",
              slug: "potato-whisperer",
              ratings: { nodes: [{ name: "9.4" }] },
              yearsOfVisit: { nodes: [{ name: "2023" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
              closedDowns: { nodes: [] }
            },
            {
              title: "Mash & Gravy",
              slug: "mash-and-gravy",
              ratings: { nodes: [{ name: "8.6" }] },
              yearsOfVisit: { nodes: [{ name: "2024" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
              closedDowns: { nodes: [] }
            },
            {
              title: "Sunday Mashed Favourite",
              slug: "sunday-mashed-favourite",
              ratings: { nodes: [{ name: "8.1" }] },
              yearsOfVisit: { nodes: [{ name: "2022" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
              closedDowns: { nodes: [] }
            },
            {
              title: "Mash Rookie",
              slug: "mash-rookie",
              ratings: { nodes: [{ name: "7.0" }] },
              yearsOfVisit: { nodes: [{ name: "2021" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
              closedDowns: { nodes: [] }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        }
      };
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./roast-dinners-in-london-with-mashed-potato.astro");
    const html = await container.renderToString(Page);

    expect(getSinglePageDataMock).toHaveBeenCalledWith({ variables: { id: "7041" } });
    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      { search: '"Mashed Potato"' }
    );
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      { after: "cursor-1", search: '"Mashed Potato"' }
    );

    expect(html).toContain("Roast Dinners in London with Mashed Potato");
    expect(html).toContain("Our favourite mashed potato roasts in London.");

    expect(html).toContain("Mash Supreme");
    expect(html).toContain("Potato Whisperer");
    expect(html).toContain("Mash &amp; Gravy");
    expect(html).toContain("Sunday Mashed Favourite");
    expect(html).toContain("Buttery Mash");

    expect(html).not.toContain("Mash Rookie");
    expect(html).not.toContain("Guide Only");
    expect(html).not.toContain("Temporarily Closed Roast");

    const first = html.indexOf("Mash Supreme");
    const second = html.indexOf("Potato Whisperer");
    const third = html.indexOf("Mash &amp; Gravy");
    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(-1);
    expect(third).toBeGreaterThan(-1);
    expect(first).toBeLessThan(second);
    expect(second).toBeLessThan(third);

    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
    expect(html).toContain("Get new roast reviews direct to your inbox");
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners in London/);
  });

  test("uses logo fallback image when featured image is missing", async () => {
    getSinglePageDataMock.mockResolvedValue({
      id: "page-mash",
      pageId: "7041",
      slug: "roast-dinners-in-london-with-mashed-potato",
      title: "Roast Dinners in London with Mashed Potato",
      content: "<p>Our favourite mashed potato roasts in London.</p>",
      featuredImage: null,
      comments: { nodes: [] },
      seo: {
        opengraphDescription: "The best mashed potato roast dinners.",
        opengraphImage: { sourceUrl: "https://example.com/mash-og.jpg" }
      }
    });

    fetchGraphQLMock.mockResolvedValue({
      posts: {
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./roast-dinners-in-london-with-mashed-potato.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Roast Dinners in London with Mashed Potato");
    expect(html).toContain('class="image-container"');
    expect(html).not.toContain("https://example.com/mash-hero.jpg");
  });
});
