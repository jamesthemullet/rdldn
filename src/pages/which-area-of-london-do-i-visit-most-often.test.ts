import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => ({
    id: "page-area-visits",
    pageId: "8297",
    slug: "which-area-of-london-do-i-visit-most-often",
    title: "Which Area Of London Do I Visit Most Often?",
    content: "<p>Area visit frequencies by year.</p>",
    featuredImage: { node: { sourceUrl: "https://example.com/area-visits.jpg" } },
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Area visits over time.",
      opengraphImage: { sourceUrl: "https://example.com/area-visits-og.jpg" }
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
            { yearsOfVisit: { nodes: [{ name: "2024" }] }, areas: { nodes: [{ name: "Central London" }, { name: "North London" }] } },
            { yearsOfVisit: { nodes: [{ name: "2024" }] }, areas: { nodes: [{ name: "Central London" }] } },
            { yearsOfVisit: { nodes: [{ name: "2023" }] }, areas: { nodes: [{ name: "West London" }] } },
            { yearsOfVisit: { nodes: [] }, areas: { nodes: [{ name: "South London" }] } }
          ],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" }
        }
      };
    }

    return {
      posts: {
        nodes: [
          { yearsOfVisit: { nodes: [{ name: "2023" }] }, areas: { nodes: [{ name: "North London" }] } },
          { yearsOfVisit: { nodes: [{ name: "2024" }] }, areas: { nodes: [{ name: "East London" }] } },
          { yearsOfVisit: { nodes: [{ name: "2024" }] }, areas: { nodes: [] } }
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

describe("which-area-of-london-do-i-visit-most-often page", () => {
  test("renders yearly and total area counts in configured order", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T00:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: Page } = await import("./which-area-of-london-do-i-visit-most-often.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Which Area Of London Do I Visit Most Often?");
    expect(html).toContain("2023:");
    expect(html).toContain("2024:");
    expect(html).toContain("Central London: 2 roasts");
    expect(html).toContain("North London: 1 roast");
    expect(html).toContain("East London: 1 roast");
    expect(html).toContain("Total visits by area across all years");
    expect(html).toContain("North London: 2 roast");
    expect(html).not.toContain("South London:");
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
  });
});
