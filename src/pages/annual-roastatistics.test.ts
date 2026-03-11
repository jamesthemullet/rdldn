import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();
const getSinglePageDataMock = vi.fn();

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock
}));

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: getSinglePageDataMock
}));

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
  })()
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  getSinglePageDataMock.mockReset();
  vi.resetModules();

  getSinglePageDataMock.mockResolvedValue({
    pageId: "11910",
    title: "Annual Roastatistics",
    content: "<p>Annual stats intro</p>",
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Annual roast stats",
      opengraphImage: { sourceUrl: "https://example.com/annual-og.jpg" }
    },
    featuredImage: { node: { sourceUrl: "https://example.com/annual.jpg" } }
  });

  fetchGraphQLMock.mockImplementation(async (_query: string, variables: Record<string, unknown> = {}) => {
    if (!variables.after) {
      return {
        posts: {
          nodes: [
            {
              title: "Lambeth Roast",
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
              yearsOfVisit: { nodes: [{ name: "2025" }] },
              ratings: { nodes: [{ name: "8.0" }] },
              prices: { nodes: [{ name: "GBP 20" }] },
              areas: { nodes: [{ name: "South London" }] },
              boroughs: { nodes: [{ name: "Lambeth" }] }
            },
            {
              title: "Camden Roast",
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
              yearsOfVisit: { nodes: [{ name: "2025" }] },
              ratings: { nodes: [{ name: "6.0" }] },
              prices: { nodes: [{ name: "GBP 30" }] },
              areas: { nodes: [{ name: "North London" }] },
              boroughs: { nodes: [{ name: "Camden" }] }
            },
            {
              title: "Range Price Roast",
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
              yearsOfVisit: { nodes: [{ name: "2025" }] },
              ratings: { nodes: [{ name: "7.0" }] },
              prices: { nodes: [{ name: "GBP 15-25" }] },
              areas: { nodes: [{ name: "South London" }] },
              boroughs: { nodes: [{ name: "Lambeth" }] }
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
            title: "Old Year Roast",
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            yearsOfVisit: { nodes: [{ name: "2024" }] },
            ratings: { nodes: [{ name: "9.0" }] },
            prices: { nodes: [{ name: "GBP 40" }] },
            areas: { nodes: [{ name: "East London" }] },
            boroughs: { nodes: [{ name: "Tower Hamlets" }] }
          },
          {
            title: "Not Roast",
            typesOfPost: { nodes: [{ name: "Guide" }] },
            yearsOfVisit: { nodes: [{ name: "2025" }] },
            ratings: { nodes: [{ name: "10.0" }] },
            prices: { nodes: [{ name: "GBP 5" }] },
            areas: { nodes: [{ name: "West London" }] },
            boroughs: { nodes: [{ name: "Hammersmith and Fulham" }] }
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    };
  });
});

describe("annual-roastatistics page", () => {
  test("defaults to latest year and renders yearly stats", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./annual-roastatistics.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/annual-roastatistics")
    });

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Annual Roastatistics");
    expect(html).toContain("Annual stats intro");
    expect(html).toMatch(/value="2025"[^>]*selected/);
    expect(html).toMatch(/Average rating:\s*7\.00/);
    expect(html).toMatch(/Highest rating:\s*8\.00/);
    expect(html).toMatch(/Lowest rating:\s*6\.00/);
    expect(html).toMatch(/Average price:\s*£\s*23\.33/);
    expect(html).toMatch(/Most expensive:\s*£\s*30\.00/);
    expect(html).toMatch(/Least expensive:\s*£\s*20\.00/);
    expect(html).toContain("Roasts reviewed: 3");
    expect(html).toContain("South London: 2");
    expect(html).toContain("North London: 1");
    expect(html).toContain("Lambeth: 2");
    expect(html).toContain("Camden: 1");
    expect(html).toContain("No meat data for this year.");
    expect(html).toContain("Any comments?");
    expect(html).not.toContain("Not Roast");
  });

  test("uses year from query string", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./annual-roastatistics.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/annual-roastatistics?year=2024")
    });

    expect(html).toMatch(/value="2024"[^>]*selected/);
    expect(html).toMatch(/Average rating:\s*9\.00/);
    expect(html).toMatch(/Highest rating:\s*9\.00/);
    expect(html).toMatch(/Lowest rating:\s*9\.00/);
    expect(html).toMatch(/Average price:\s*£\s*40\.00/);
    expect(html).toMatch(/Most expensive:\s*£\s*40\.00/);
    expect(html).toMatch(/Least expensive:\s*£\s*40\.00/);
    expect(html).toContain("Roasts reviewed: 1");
    expect(html).toContain("East London");
    expect(html).toContain("Tower Hamlets: 1");
  });

  test("handles missing and invalid numeric values and excludes placeholder boroughs", async () => {
    fetchGraphQLMock.mockImplementation(async () => ({
      posts: {
        nodes: [
          {
            title: "No Numbers Roast",
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            yearsOfVisit: { nodes: [{ name: "2026" }] },
            ratings: { nodes: [{ name: "unknown" }] },
            prices: { nodes: [{ name: "TBC" }] },
            areas: { nodes: [] },
            boroughs: { nodes: [{ name: "N/A" }] },
            meats: { nodes: [{ name: "Beef" }] }
          },
          {
            title: "Missing Values Roast",
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            yearsOfVisit: { nodes: [{ name: "2026" }] },
            ratings: { nodes: [] },
            prices: { nodes: [] },
            areas: { nodes: [] },
            boroughs: { nodes: [{ name: "none" }] },
            meats: { nodes: [{ name: "Beef" }, { name: "Chicken" }] }
          },
          {
            title: "Valid Numbers Roast",
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            yearsOfVisit: { nodes: [{ name: "2026" }] },
            ratings: { nodes: [{ name: "7.5" }] },
            prices: { nodes: [{ name: "GBP 25" }] },
            areas: { nodes: [{ name: "East London" }] },
            boroughs: { nodes: [{ name: "Hackney" }] },
            meats: { nodes: [{ name: "Pork" }] }
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    }));

    const container = await AstroContainer.create();
    const { default: Page } = await import("./annual-roastatistics.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/annual-roastatistics?year=2026")
    });

    expect(html).toMatch(/Average rating:\s*7\.50/);
    expect(html).toMatch(/Highest rating:\s*7\.50/);
    expect(html).toMatch(/Lowest rating:\s*7\.50/);
    expect(html).toMatch(/Average price:\s*£\s*25\.00/);
    expect(html).toMatch(/Most expensive:\s*£\s*25\.00/);
    expect(html).toMatch(/Least expensive:\s*£\s*25\.00/);
    expect(html).toContain("East London: 1");
    expect(html).toContain("Hackney: 1");
    expect(html).not.toContain("N/A");
    expect(html).not.toContain("none: 1");
    expect(html).toContain("Beef: 2");
    expect(html).toContain("Chicken: 1");
    expect(html).toContain("Pork: 1");
  });

  test("renders no-year-data empty state when roast posts have no year terms", async () => {
    fetchGraphQLMock.mockResolvedValue({
      posts: {
        nodes: [
          {
            title: "Roast Without Year",
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            yearsOfVisit: { nodes: [] },
            ratings: { nodes: [{ name: "8.0" }] },
            prices: { nodes: [{ name: "GBP 25" }] }
          },
          {
            title: "Guide With Year",
            typesOfPost: { nodes: [{ name: "Guide" }] },
            yearsOfVisit: { nodes: [{ name: "2025" }] }
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./annual-roastatistics.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/annual-roastatistics")
    });

    expect(html).toContain("No roast dinner reviews with year data were found.");
    expect(html).not.toContain("Select Year:");
  });

  test("shows no rating data when selected year has no valid ratings", async () => {
    fetchGraphQLMock.mockResolvedValue({
      posts: {
        nodes: [
          {
            title: "Missing Rating Roast",
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            yearsOfVisit: { nodes: [{ name: "2027" }] },
            ratings: { nodes: [] },
            prices: { nodes: [{ name: "GBP 18" }] },
            areas: { nodes: [{ name: "South London" }] },
            boroughs: { nodes: [{ name: "Lambeth" }] }
          },
          {
            title: "Invalid Rating Roast",
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            yearsOfVisit: { nodes: [{ name: "2027" }] },
            ratings: { nodes: [{ name: "N/A" }] },
            prices: { nodes: [{ name: "GBP 22" }] },
            areas: { nodes: [{ name: "North London" }] },
            boroughs: { nodes: [{ name: "Camden" }] }
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./annual-roastatistics.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/annual-roastatistics?year=2027")
    });

    expect(html).toContain("No rating data");
    expect((html.match(/No rating data/g) ?? []).length).toBe(3);
    expect(html).toMatch(/Average price:\s*£\s*20\.00/);
    expect(html).toContain("Roasts reviewed: 2");
  });
});
