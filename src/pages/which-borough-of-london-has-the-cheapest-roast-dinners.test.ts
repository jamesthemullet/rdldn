import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => ({
    id: "page-borough-cheap",
    pageId: "7169",
    slug: "which-borough-of-london-has-the-cheapest-roast-dinners",
    title: "Which Borough Of London Has The Cheapest Roast Dinners?",
    content: "<p>Borough price averages.</p>",
    featuredImage: { node: { sourceUrl: "https://example.com/borough-cheap.jpg" } },
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Cheapest borough roast averages.",
      opengraphImage: { sourceUrl: "https://example.com/borough-cheap-og.jpg" }
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
            { boroughs: { nodes: [{ name: "Hackney" }] }, prices: { nodes: [{ name: "£20" }] } },
            { boroughs: { nodes: [{ name: "Hackney" }] }, prices: { nodes: [{ name: "£22" }] } },
            { boroughs: { nodes: [{ name: "Hackney" }] }, prices: { nodes: [{ name: "£24" }] } },
            { boroughs: { nodes: [{ name: "Westminster" }] }, prices: { nodes: [{ name: "£30" }] } },
            { boroughs: { nodes: [{ name: "Westminster" }] }, prices: { nodes: [{ name: "£32" }] } },
            { boroughs: { nodes: [{ name: "Camden" }] }, prices: { nodes: [{ name: "£10" }] } },
            { boroughs: { nodes: [] }, prices: { nodes: [{ name: "£1" }] } },
            { boroughs: { nodes: [{ name: "Ignored Missing Price" }] }, prices: { nodes: [] } }
          ],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" }
        }
      };
    }

    return {
      posts: {
        nodes: [
          { boroughs: { nodes: [{ name: "Hackney" }] }, prices: { nodes: [{ name: "£26" }] } },
          { boroughs: { nodes: [{ name: "Hackney" }] }, prices: { nodes: [{ name: "£28" }] } },
          { boroughs: { nodes: [{ name: "Westminster" }] }, prices: { nodes: [{ name: "£34" }] } },
          { boroughs: { nodes: [{ name: "Westminster" }] }, prices: { nodes: [{ name: "£36" }] } },
          { boroughs: { nodes: [{ name: "Westminster" }] }, prices: { nodes: [{ name: "£38" }] } },
          { boroughs: { nodes: [{ name: "Ignored Bad Price" }] }, prices: { nodes: [{ name: "price unknown" }] } },
          { boroughs: { nodes: [{ name: "Ignored Zero" }] }, prices: { nodes: [{ name: "£0" }] } }
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

describe("which-borough-of-london-has-the-cheapest-roast-dinners page", () => {
  test("renders borough averages with minimum 5 reviews sorted by cheapest", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./which-borough-of-london-has-the-cheapest-roast-dinners.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Which Borough Of London Has The Cheapest Roast Dinners?");
    expect(html).toMatch(/The average price in\s+Hackney\s+is\s+£24\.00\s*\(5\s+reviews\)/);
    expect(html).toMatch(/The average price in\s+Westminster\s+is\s+£34\.00\s*\(5\s+reviews\)/);
    expect(html).not.toContain("Camden");
    expect(html).not.toContain("Ignored Missing Price");
    expect(html).not.toContain("Ignored Bad Price");
    expect(html).not.toContain("Ignored Zero");

    const hackneyIndex = html.indexOf("Hackney");
    const westminsterIndex = html.indexOf("Westminster");
    expect(hackneyIndex).toBeLessThan(westminsterIndex);
    expect(html).toContain("Any comments?");
  });
});
