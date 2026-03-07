import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => ({
    id: "page-zones",
    pageId: "11705",
    slug: "which-fare-zones-do-i-visit-most-often",
    title: "Which Fare Zones Do I Visit Most Often?",
    content: "<p>Fare zone counts by year.</p>",
    featuredImage: { node: { sourceUrl: "https://example.com/zones.jpg" } },
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Fare zone visit distribution.",
      opengraphImage: { sourceUrl: "https://example.com/zones-og.jpg" }
    }
  }))
}));

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock
}));

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  vi.resetModules();

  fetchGraphQLMock.mockImplementation(async (_query: string, variables: Record<string, unknown> = {}) => {
    if (!variables.after) {
      return {
        posts: {
          nodes: [
            {
              yearsOfVisit: { nodes: [{ name: "2024" }] },
              zones: {
                nodes: [
                  { name: "Zone 2" },
                  { name: "Zone 2B" },
                  { name: "Zone 2A" },
                  { name: "Zone 10" },
                  { name: "Central" },
                  { name: "Outer Zone" }
                ]
              }
            },
            { yearsOfVisit: { nodes: [{ name: "2024" }] }, zones: { nodes: [{ name: "Zone 2" }] } },
            { yearsOfVisit: { nodes: [{ name: "2023" }] }, zones: { nodes: [{ name: "Zone 1" }] } },
            { yearsOfVisit: { nodes: [] }, zones: { nodes: [{ name: "Ignored Missing Year" }] } },
            { yearsOfVisit: { nodes: [{ name: "2024" }] }, zones: { nodes: [] } }
          ],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" }
        }
      };
    }

    return {
      posts: {
        nodes: [
          { yearsOfVisit: { nodes: [{ name: "2024" }] }, zones: { nodes: [{ name: "Zone 1" }] } },
          { yearsOfVisit: { nodes: [{ name: "2023" }] }, zones: { nodes: [{ name: "Zone 2" }] } },
          { yearsOfVisit: { nodes: [{ name: "2025" }] }, zones: undefined }
        ],
        pageInfo: { hasNextPage: false, endCursor: null }
      }
    };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("which-fare-zones-do-i-visit-most-often page", () => {
  test("renders yearly and total zone counts sorted by zone number", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./which-fare-zones-do-i-visit-most-often.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(html).toContain("Which Fare Zones Do I Visit Most Often?");
    expect(html).toContain("2023");
    expect(html).toContain("2024");
    expect(html).toContain("Zone 1: 1 roast");
    expect(html).toContain("Zone 2: 1 roast");
    expect(html).toContain("Zone 2A: 1 roast");
    expect(html).toContain("Zone 2B: 1 roast");
    expect(html).toContain("Zone 10: 1 roast");
    expect(html).toContain("Central: 1 roast");
    expect(html).toContain("Outer Zone: 1 roast");
    expect(html).toContain("Zone 2: 2 roasts");
    expect(html).toContain("Total visits by fare zone across all years");
    expect(html).toContain("Zone 1: 2 roasts");
    expect(html).not.toContain("Ignored Missing Year");

    const zone1Index = html.indexOf("Zone 1:");
    const zone2Index = html.indexOf("Zone 2:");
    const zone2AIndex = html.indexOf("Zone 2A:");
    const zone2BIndex = html.indexOf("Zone 2B:");
    const zone10Index = html.indexOf("Zone 10:");
    const centralIndex = html.indexOf("Central:");
    const outerZoneIndex = html.indexOf("Outer Zone:");
    expect(zone1Index).toBeLessThan(zone2Index);
    expect(zone2Index).toBeLessThan(zone2AIndex);
    expect(zone2AIndex).toBeLessThan(zone2BIndex);
    expect(zone2Index).toBeLessThan(zone10Index);
    expect(zone10Index).toBeLessThan(centralIndex);
    expect(centralIndex).toBeLessThan(outerZoneIndex);
  });
});
