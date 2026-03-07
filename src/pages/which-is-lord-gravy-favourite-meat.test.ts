import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => ({
    id: "page-meat",
    pageId: "9891",
    slug: "which-is-lord-gravy-favourite-meat",
    title: "Which Is Lord Gravy Favourite Meat?",
    content: "<p>Average ratings by meat type.</p>",
    featuredImage: { node: { sourceUrl: "https://example.com/meat.jpg" } },
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Favourite meats by roast score.",
      opengraphImage: { sourceUrl: "https://example.com/meat-og.jpg" }
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
            { meats: { nodes: [{ name: "Beef" }] }, ratings: { nodes: [{ name: "9.0" }] } },
            { meats: { nodes: [{ name: "Beef" }] }, ratings: { nodes: [{ name: "8.0" }] } },
            { meats: { nodes: [{ name: "Lamb" }] }, ratings: { nodes: [{ name: "7.0" }] } },
            { meats: { nodes: [{ name: "Lamb" }] }, ratings: { nodes: [{ name: "7.5" }] } },
            { meats: { nodes: [{ name: "Pork" }] }, ratings: { nodes: [{ name: "9.9" }] } },
            { meats: { nodes: [] }, ratings: { nodes: [{ name: "9.9" }] } }
          ],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" }
        }
      };
    }

    return {
      posts: {
        nodes: [
          { meats: { nodes: [{ name: "Beef" }] }, ratings: { nodes: [{ name: "8.5" }] } },
          { meats: { nodes: [{ name: "Lamb" }] }, ratings: { nodes: [{ name: "8.0" }] } },
          { meats: { nodes: [{ name: "Ignored Missing Rating" }] }, ratings: { nodes: [] } },
          { meats: { nodes: [{ name: "Ignored Bad Rating" }] }, ratings: { nodes: [{ name: "nope" }] } },
          { meats: { nodes: [{ name: "Ignored Zero" }] }, ratings: { nodes: [{ name: "0" }] } }
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

describe("which-is-lord-gravy-favourite-meat page", () => {
  test("renders meat averages with minimum three reviews sorted high to low", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./which-is-lord-gravy-favourite-meat.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Which Is Lord Gravy Favourite Meat?");
    expect(html).toMatch(/The average rating for\s+Beef\s+is\s+8\.50\s*\(\s*3\s+reviews\)/);
    expect(html).toMatch(/The average rating for\s+Lamb\s+is\s+7\.50\s*\(\s*3\s+reviews\)/);
    expect(html).not.toContain("Pork");
    expect(html).not.toContain("Ignored Missing Rating");
    expect(html).not.toContain("Ignored Bad Rating");
    expect(html).not.toContain("Ignored Zero");

    const beefIndex = html.indexOf("Beef");
    const lambIndex = html.indexOf("Lamb");
    expect(beefIndex).toBeLessThan(lambIndex);
    expect(html).toContain("Any comments?");
  });
});
