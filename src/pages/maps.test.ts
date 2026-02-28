import { getContainerRenderer as getReactContainerRenderer } from "@astrojs/react";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("../lib/api", () => ({
  fetchGraphQL: vi.fn()
}));

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

const createContainer = async () => {
  const container = await AstroContainer.create({
    renderers: [getReactContainerRenderer()]
  });
  return container;
};

describe("maps page", () => {
  test("renders map page and builds markers from paginated post locations", async () => {
    const { fetchGraphQL } = await import("../lib/api");
    const fetchGraphQLMock = vi.mocked(fetchGraphQL);

    fetchGraphQLMock.mockImplementation(async (_query: string, variables: Record<string, unknown> = {}) => {
      if ("id" in variables) {
        return {
          page: {
            id: "page-maps",
            pageId: "631",
            title: "Roast Map",
            content: "<p>Map intro</p>",
            featuredImage: {
              node: {
                sourceUrl: "",
                altText: ""
              }
            },
            comments: {
              nodes: []
            },
            seo: {
              opengraphImage: { sourceUrl: "https://example.com/maps-og.jpg" },
              opengraphDescription: "Find roast dinners across London"
            }
          }
        };
      }

      if (!variables.after) {
        return {
          posts: {
            nodes: [
              {
                title: "Map Pub One",
                slug: "map-pub-one",
                location: { latitude: "51.500", longitude: "-0.100" },
                ratings: { nodes: [{ name: "4.8" }] },
                closedDowns: { nodes: [] }
              },
              {
                title: "Missing Latitude",
                slug: "missing-latitude",
                location: { latitude: "", longitude: "-0.120" },
                ratings: { nodes: [{ name: "3.1" }] },
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
              title: "Map Pub Two",
              slug: "map-pub-two",
              location: { latitude: "51.490", longitude: "-0.080" },
              ratings: { nodes: [{ name: "4.2" }] },
              closedDowns: { nodes: [{ name: "Closed" }] }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        }
      };
    });

    const container = await createContainer();
    const { default: Page } = await import("./maps.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Roast Map");
    expect(html).toContain("Find roast dinners across London");
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");

    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.anything(), { id: "631" });
    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.anything(), { after: null });
    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Map Pub One");
    expect(html).toContain("map-pub-one");
    expect(html).toContain("Map Pub Two");
    expect(html).toContain("map-pub-two");
    expect(html).not.toContain("Missing Latitude");
  });

  test("throws when single page data cannot be loaded", async () => {
    const { fetchGraphQL } = await import("../lib/api");
    const fetchGraphQLMock = vi.mocked(fetchGraphQL);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    fetchGraphQLMock.mockImplementation(async (_query: string, variables: Record<string, unknown> = {}) => {
      if ("id" in variables) {
        throw new Error("single page failed");
      }

      return {
        posts: {
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        }
      };
    });

    const container = await createContainer();
    const { default: Page } = await import("./maps.astro?single-page-missing");

    await expect(container.renderToString(Page)).rejects.toThrow("No single page data found");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching GraphQL data:",
      expect.any(Error)
    );
  });

  test("renders when post-locations fetch fails and logs the posts catch", async () => {
    const { fetchGraphQL } = await import("../lib/api");
    const fetchGraphQLMock = vi.mocked(fetchGraphQL);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    fetchGraphQLMock.mockImplementation(async (_query: string, variables: Record<string, unknown> = {}) => {
      if ("id" in variables) {
        return {
          page: {
            id: "page-maps",
            pageId: "631",
            title: "Roast Map",
            content: "<p>Map intro</p>",
            featuredImage: {
              node: {
                sourceUrl: "",
                altText: ""
              }
            },
            comments: {
              nodes: []
            },
            seo: {
              opengraphImage: { sourceUrl: "https://example.com/maps-og.jpg" },
              opengraphDescription: "Find roast dinners across London"
            }
          }
        };
      }

      throw new Error("posts fetch failed");
    });

    const container = await createContainer();
    const { default: Page } = await import("./maps.astro?posts-fetch-failure");
    const html = await container.renderToString(Page);

    expect(html).toContain("Roast Map");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching GraphQL data:",
      expect.any(Error)
    );
  });
});
