import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

const mockPage = {
  pageId: "10606",
  title: "Geographical Spread of Roast Dinner Reviews Each Year",
  content: "<p>Tracking where roast dinners were reviewed across London.</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Where roast reviews happened by area, year by year.",
    opengraphImage: { sourceUrl: "https://example.com/geo-spread-og.jpg" }
  },
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/geo-spread-hero.jpg"
    }
  }
};

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => mockPage)
}));

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock
}));

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    const AstroImageComponent = ImageComponent as typeof ImageComponent & {
      isAstroComponentFactory: boolean;
    };
    AstroImageComponent.isAstroComponentFactory = true;
    return AstroImageComponent;
  })()
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  vi.resetModules();

  fetchGraphQLMock.mockImplementation(async (_query: string, variables: Record<string, unknown> = {}) => {
    const afterCursor = typeof variables.after === "string" ? variables.after : null;

    if (!afterCursor) {
      return {
        posts: {
          nodes: [
            {
              yearsOfVisit: { nodes: [{ name: "2024" }] },
              areas: {
                nodes: [
                  { name: "East London" },
                  { name: "Central London" },
                  { name: "South East London" }
                ]
              }
            },
            {
              yearsOfVisit: { nodes: [{ name: "2024" }] },
              areas: { nodes: [{ name: "Central London" }] }
            },
            {
              yearsOfVisit: { nodes: [{ name: "2023" }] },
              areas: { nodes: [{ name: "North London" }] }
            },
            {
              yearsOfVisit: { nodes: [{ name: "2023" }] },
              areas: { nodes: [] }
            },
            {
              yearsOfVisit: { nodes: [] },
              areas: { nodes: [{ name: "West London" }] }
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
            yearsOfVisit: { nodes: [{ name: "2023" }] },
            areas: { nodes: [{ name: "West London" }, { name: "North London" }] }
          },
          {
            yearsOfVisit: { nodes: [{ name: "2024" }] },
            areas: { nodes: [{ name: "South London" }] }
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

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("geographical-spread-of-roast-dinner-reviews-each-year page", () => {
  test("renders yearly geographical counts with pagination and area ordering", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T00:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: Page } = await import("./geographical-spread-of-roast-dinner-reviews-each-year.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Geographical Spread of Roast Dinner Reviews Each Year");
    expect(html).toContain("Tracking where roast dinners were reviewed across London.");

    const year2023Index = html.indexOf("2023:");
    const year2024Index = html.indexOf("2024:");

    expect(year2023Index).toBeGreaterThan(-1);
    expect(year2024Index).toBeGreaterThan(-1);
    expect(year2023Index).toBeLessThan(year2024Index);

    const year2023Section = html.slice(year2023Index, year2024Index);
    expect(year2023Section).toContain("North London: 2 roasts");
    expect(year2023Section).toContain("West London: 1 roast");

    const year2024Section = html.slice(year2024Index);
    expect(year2024Section).toContain("Central London: 2 roasts");
    expect(year2024Section).toContain("East London: 1 roast");
    expect(year2024Section).toContain("South London: 1 roast");
    expect(year2024Section).toContain("South East London: 1 roast");

    const centralIndex = year2024Section.indexOf("Central London: 2 roasts");
    const eastIndex = year2024Section.indexOf("East London: 1 roast");
    const southIndex = year2024Section.indexOf("South London: 1 roast");
    const extraAreaIndex = year2024Section.indexOf("South East London: 1 roast");

    expect(centralIndex).toBeLessThan(eastIndex);
    expect(eastIndex).toBeLessThan(southIndex);
    expect(southIndex).toBeLessThan(extraAreaIndex);

    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners in London/);
  });
});
