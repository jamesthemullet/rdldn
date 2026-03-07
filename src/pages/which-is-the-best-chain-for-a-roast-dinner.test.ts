import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => ({
    id: "page-chain",
    pageId: "8441",
    slug: "which-is-the-best-chain-for-a-roast-dinner",
    title: "Which Is The Best Chain For A Roast Dinner?",
    content: "<p>Chain rankings by roast score.</p>",
    featuredImage: { node: { sourceUrl: "https://example.com/chain.jpg" } },
    comments: { nodes: [] },
    seo: {
      opengraphDescription: "Best chain roast stats.",
      opengraphImage: { sourceUrl: "https://example.com/chain-og.jpg" }
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
            { ratings: { nodes: [{ name: "8.0" }] }, owners: { nodes: [{ name: "Roast Group" }] } },
            { ratings: { nodes: [{ name: "7.0" }] }, owners: { nodes: [{ name: "Pub Co" }] } },
            { ratings: { nodes: [{ name: "10.0" }] }, owners: { nodes: [{ name: "Independent" }] } },
            { ratings: { nodes: [{ name: "not-a-number" }] }, owners: { nodes: [{ name: "Bad Rating Chain" }] } },
            { ratings: { nodes: [{ name: "" }] }, owners: { nodes: [{ name: "Empty Rating Chain" }] } },
            { ratings: { nodes: [{ name: "8.2" }] }, owners: { nodes: [] } },
            { ratings: { nodes: [{ name: "8.3" }] }, owners: undefined }
          ],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" }
        }
      };
    }

    return {
      posts: {
        nodes: [
          { ratings: { nodes: [{ name: "9.0" }] }, owners: { nodes: [{ name: "Roast Group" }] } },
          { ratings: { nodes: [{ name: "7.5" }] }, owners: { nodes: [{ name: "Pub Co" }] } },
          { ratings: { nodes: [{ name: "9.9" }] }, owners: { nodes: [{ name: "Solo Chain" }] } },
          { ratings: undefined, owners: { nodes: [{ name: "Missing Rating Chain" }] } }
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

describe("which-is-the-best-chain-for-a-roast-dinner page", () => {
  test("renders non-independent chains with more than one visit sorted by average", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./which-is-the-best-chain-for-a-roast-dinner.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Which Is The Best Chain For A Roast Dinner?");
    expect(html).toContain("Roast Group");
    expect(html).toMatch(/8\.50\s*\(2\s+visits\)/);
    expect(html).toContain("Pub Co");
    expect(html).toMatch(/7\.25\s*\(2\s+visits\)/);

    expect(html).not.toContain("Independent");
    expect(html).not.toContain("Solo Chain");
    expect(html).not.toContain("Bad Rating Chain");
    expect(html).not.toContain("Empty Rating Chain");
    expect(html).not.toContain("Missing Rating Chain");

    const roastGroupIndex = html.indexOf("Roast Group");
    const pubCoIndex = html.indexOf("Pub Co");
    expect(roastGroupIndex).toBeLessThan(pubCoIndex);
  });
});
