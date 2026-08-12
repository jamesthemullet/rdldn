import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../components/header/HeaderAuth");

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock,
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
  })(),
}));

const createFeaturedImageNode = (homepageUrl: string, sourceUrl: string = homepageUrl) => ({
  node: {
    sourceUrl,
    mediaDetails: {
      sizes: [{ name: "homepage", sourceUrl: homepageUrl }],
    },
  },
});

const getDefaultResponseByQuery = (query: string, variables: Record<string, unknown> = {}) => {
  if (query.includes("GetMostRecentPost")) {
    return {
      posts: {
        nodes: [
          {
            slug: "latest-roast",
            title: "Latest Roast",
            featuredImage: createFeaturedImageNode("https://example.com/latest-homepage.jpg"),
            seo: {
              opengraphImage: {
                sourceUrl: "https://example.com/latest-og.jpg",
              },
            },
          },
        ],
        pageInfo: {
          endCursor: "cursor-1",
        },
      },
    };
  }

  if (query.includes("GetOtherPosts")) {
    return {
      posts: {
        nodes: [
          {
            slug: "other-roast",
            title: "Other Roast",
            featuredImage: createFeaturedImageNode("https://example.com/other-homepage.jpg"),
          },
        ],
      },
    };
  }

  if (query.includes("query SinglePage($id: ID!)")) {
    const id = String(variables.id ?? "");
    return {
      page: {
        pageId: id,
        slug: `page-${id}`,
        title: `Page ${id}`,
        featuredImage: createFeaturedImageNode(`https://example.com/page-${id}-homepage.jpg`),
      },
    };
  }

  throw new Error(`Unhandled query in test mock: ${query.slice(0, 60)}`);
};

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("index page", () => {
  test("renders home sections from GraphQL data and calls expected variables", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) =>
        getDefaultResponseByQuery(query, variables)
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(10);
    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.stringContaining("GetOtherPosts"), {
      after: "cursor-1",
    });
    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.stringContaining("SinglePage"), {
      id: "5614",
    });
    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.stringContaining("SinglePage"), {
      id: "267",
    });

    expect(html).toContain("Latest Reviews:");
    expect(html).toContain("Latest Roast");
    expect(html).toContain("Other Roast");
    expect(html).toContain("Find Your Favourite Roast:");
    expect(html).toContain("Roast By Location:");
    expect(html).toContain("Search:");
    expect(html).toContain("data-result-limit=\"4\"");

    expect(html).toContain("A few of the best roasts:");
    expect(html).toContain("Features:");
    expect(html).toContain("Roastatistics:");
    expect(html).toContain('x-data="homepageHighlights"');
    expect(html).toContain("/api/homepage-highlights.json");

    expect(html).not.toContain("Page 4102");
  });

  test("continues to render remaining sections when most recent post query fails", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("GetMostRecentPost")) {
          throw new Error("Most recent post failed");
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(9);
    expect(fetchGraphQLMock).not.toHaveBeenCalledWith(expect.stringContaining("GetOtherPosts"), {
      after: "cursor-1",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching the most recent post:",
      expect.any(Error)
    );

    expect(html).toContain("Latest Reviews:");
    expect(html).toContain("Find Your Favourite Roast:");
    expect(html).toContain("Roast By Location:");
    expect(html).toContain("Search:");
  });

  test("renders remaining content when most recent query returns no posts", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("GetMostRecentPost")) {
          return {
            posts: {
              nodes: [],
              pageInfo: {
                endCursor: null,
              },
            },
          };
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(9);
    expect(fetchGraphQLMock).not.toHaveBeenCalledWith(expect.stringContaining("GetOtherPosts"), {
      after: "cursor-1",
    });
    expect(html).toContain("Latest Reviews:");
    expect(html).toContain("Find Your Favourite Roast:");
    expect(html).toContain("Roast By Location:");
    expect(html).toContain("Search:");
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      "Error fetching the most recent post:",
      expect.anything()
    );
  });

  test("uses other post sourceUrl when homepage image size is missing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("GetOtherPosts")) {
          return {
            posts: {
              nodes: [
                {
                  slug: "other-roast-fallback",
                  title: "Other Roast Fallback",
                  featuredImage: {
                    node: {
                      sourceUrl: "https://example.com/other-fallback-source.jpg",
                      mediaDetails: {
                        sizes: [{ name: "thumbnail", sourceUrl: "https://example.com/thumb.jpg" }],
                      },
                    },
                  },
                },
              ],
            },
          };
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.stringContaining("GetOtherPosts"), {
      after: "cursor-1",
    });
    expect(html).toContain("Other Roast Fallback");
    expect(html).toContain('src="https://example.com/other-fallback-source.jpg"');
  });

  test("logs and continues when other posts request fails", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("GetOtherPosts")) {
          throw new Error("Other posts failed");
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(10);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching other posts:",
      expect.any(Error)
    );
    expect(html).toContain("Latest Roast");
    expect(html).not.toContain("Other Roast");
  });

  test("uses most recent post sourceUrl when homepage image size is missing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("GetMostRecentPost")) {
          return {
            posts: {
              nodes: [
                {
                  slug: "latest-roast-fallback",
                  title: "Latest Roast Fallback",
                  featuredImage: {
                    node: {
                      sourceUrl: "https://example.com/latest-fallback-source.jpg",
                      mediaDetails: {
                        sizes: [{ name: "thumbnail", sourceUrl: "https://example.com/latest-thumb.jpg" }],
                      },
                    },
                  },
                  seo: {
                    opengraphImage: {
                      sourceUrl: "https://example.com/latest-fallback-og.jpg",
                    },
                  },
                },
              ],
              pageInfo: {
                endCursor: "cursor-1",
              },
            },
          };
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Latest Roast Fallback");
    expect(html).toContain('src="https://example.com/latest-fallback-source.jpg"');
  });

  test("filters out location entries when a single page response has no page", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("query SinglePage($id: ID!)") && variables.id === "5614") {
          return {};
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.stringContaining("SinglePage"), {
      id: "5614",
    });
    expect(html).toContain("Roast By Location:");
    expect(html).not.toContain("Page 5614");
    expect(html).toContain("Page 5612");
  });

  test("filters out favourite roast entries when a single page response has no page", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("query SinglePage($id: ID!)") && variables.id === "267") {
          return {};
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.stringContaining("SinglePage"), {
      id: "267",
    });
    expect(html).toContain("Find Your Favourite Roast:");
    expect(html).not.toContain("Page 267");
    expect(html).toContain("Page 631");
  });

  test("uses location page sourceUrl when homepage image size is missing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("query SinglePage($id: ID!)") && variables.id === "5612") {
          return {
            page: {
              pageId: "5612",
              slug: "page-5612",
              title: "Page 5612",
              featuredImage: {
                node: {
                  sourceUrl: "https://example.com/location-fallback-source.jpg",
                  mediaDetails: {
                    sizes: [{ name: "thumbnail", sourceUrl: "https://example.com/location-thumb.jpg" }],
                  },
                },
              },
            },
          };
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Page 5612");
    expect(html).toContain('src="https://example.com/location-fallback-source.jpg"');
  });

  test("logs and continues when fetching location pages fails", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("query SinglePage($id: ID!)") && variables.id === "5614") {
          throw new Error("Location page failed");
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching location pages:",
      expect.any(Error)
    );
    expect(html).toContain("Roast By Location:");
    expect(html).not.toContain("Page 5612");
    expect(html).toContain("Find Your Favourite Roast:");
  });

  test("logs and continues when fetching favourite roast pages fails", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("query SinglePage($id: ID!)") && variables.id === "267") {
          throw new Error("Favourite roast page failed");
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching favourite roast pages:",
      expect.any(Error)
    );
    expect(html).toContain("Find Your Favourite Roast:");
    expect(html).not.toContain("Page 631");
    expect(html).toContain("Roast By Location:");
  });

  test("uses favourite roast page sourceUrl when homepage image size is missing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("query SinglePage($id: ID!)") && variables.id === "267") {
          return {
            page: {
              pageId: "267",
              slug: "page-267",
              title: "Page 267",
              featuredImage: {
                node: {
                  sourceUrl: "https://example.com/favourite-fallback-source.jpg",
                  mediaDetails: {
                    sizes: [{ name: "thumbnail", sourceUrl: "https://example.com/favourite-thumb.jpg" }],
                  },
                },
              },
            },
          };
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Find Your Favourite Roast:");
    expect(html).toContain('src="https://example.com/favourite-fallback-source.jpg"');
  });
});
