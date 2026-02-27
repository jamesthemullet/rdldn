import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

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

  if (query.includes("areas") && query.includes("boroughs")) {
    return {
      areas: { nodes: [{ name: "Camden", slug: "camden" }] },
      boroughs: { nodes: [{ name: "Hackney", slug: "hackney" }] },
    };
  }

  if (query.includes("where: {tag: \"best\"}")) {
    return {
      posts: {
        nodes: [
          {
            slug: "best-roast",
            title: "Best Roast",
            featuredImage: createFeaturedImageNode("https://example.com/best-homepage.jpg"),
            ratings: { nodes: [{ name: "9.1" }] },
            yearsOfVisit: { nodes: [{ name: "2025" }] },
          },
        ],
      },
    };
  }

  if (query.includes("pages(first: 100)")) {
    return {
      pages: {
        nodes: [
          {
            id: "feature-page-1",
            slug: "feature-page-1",
            title: "Feature Page 1",
            highlights: { tag: "feature" },
            featuredImage: createFeaturedImageNode("https://example.com/feature-page-1.jpg"),
          },
          {
            id: "roastatistics-page-1",
            slug: "roastatistics-page-1",
            title: "Roastatistics Page 1",
            highlights: { tag: "roastatistics" },
            featuredImage: createFeaturedImageNode("https://example.com/roastatistics-page-1.jpg"),
          },
        ],
      },
    };
  }

  if (query.includes("where: {tag: \"feature\"}")) {
    return {
      posts: {
        edges: [
          {
            node: {
              slug: "feature-post-1",
              title: "Feature Post 1",
              featuredImage: createFeaturedImageNode("https://example.com/feature-post-1.jpg"),
            },
          },
        ],
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

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(15);
    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.stringContaining("GetOtherPosts"), {
      after: "cursor-1",
    });
    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.stringContaining("SinglePage"), {
      id: "5614",
    });
    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.stringContaining("SinglePage"), {
      id: "4102",
    });

    expect(html).toContain("Latest Reviews:");
    expect(html).toContain("Latest Roast");
    expect(html).toContain("Other Roast");
    expect(html).toContain("Find Your Favourite Roast:");
    expect(html).toContain("Roast By Location:");
    expect(html).toContain("A few of the best roasts:");
    expect(html).toContain("Best Roast");
    expect(html).toContain("Rating: 9.1");
    expect(html).toContain("Year Visited: 2025");
    expect(html).toContain("Features:");
    expect(html).toContain("Roastatistics:");
    expect(html).toContain("Search:");
    expect(html).toContain("data-result-limit=\"4\"");
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

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(14);
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
    expect(html).toContain("A few of the best roasts:");
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

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(14);
    expect(fetchGraphQLMock).not.toHaveBeenCalledWith(expect.stringContaining("GetOtherPosts"), {
      after: "cursor-1",
    });
    expect(html).toContain("Latest Reviews:");
    expect(html).toContain("Find Your Favourite Roast:");
    expect(html).toContain("Roast By Location:");
    expect(html).toContain("A few of the best roasts:");
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

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(15);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching other posts:",
      expect.any(Error)
    );
    expect(html).toContain("Latest Roast");
    expect(html).not.toContain("Other Roast");
    expect(html).toContain("A few of the best roasts:");
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
      "Error fetching location pages:",
      expect.any(Error)
    );
    expect(html).toContain("Find Your Favourite Roast:");
    expect(html).not.toContain("Page 631");
    expect(html).toContain("Roast By Location:");
  });

  test("logs and continues when fetching locations list fails", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("areas") && query.includes("boroughs")) {
          throw new Error("Locations request failed");
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
    expect(html).toContain("A few of the best roasts:");
  });

  test("logs and continues when fetching best roasts fails", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("where: {tag: \"best\"}")) {
          throw new Error("Best roasts request failed");
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching best roasts:",
      expect.any(Error)
    );
    expect(html).toContain("A few of the best roasts:");
    expect(html).not.toContain("Rating: 9.1");
  });

  test("logs and continues when features pages query fails", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("pages(first: 100)")) {
          throw new Error("All pages request failed");
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching features data:",
      expect.any(Error)
    );
    expect(html).toContain("Features:");
    expect(html).not.toContain("Feature Post 1");
  });

  test("logs and continues when roastatistics single page fetch fails", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("query SinglePage($id: ID!)") && variables.id === "4102") {
          throw new Error("Roastatistics featured page failed");
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching features data:",
      expect.any(Error)
    );
    expect(html).toContain("Roastatistics:");
    expect(html).not.toContain("Page 4102");
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

  test("uses best roast sourceUrl when homepage image size is missing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("where: {tag: \"best\"}")) {
          return {
            posts: {
              nodes: [
                {
                  slug: "best-roast-fallback",
                  title: "Best Roast Fallback",
                  featuredImage: {
                    node: {
                      sourceUrl: "https://example.com/best-fallback-source.jpg",
                      mediaDetails: {
                        sizes: [{ name: "thumbnail", sourceUrl: "https://example.com/best-thumb.jpg" }],
                      },
                    },
                  },
                  ratings: { nodes: [{ name: "8.8" }] },
                  yearsOfVisit: { nodes: [{ name: "2024" }] },
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

    expect(html).toContain("Best Roast Fallback");
    expect(html).toContain('src="https://example.com/best-fallback-source.jpg"');
  });

  test("uses feature post sourceUrl when homepage image size is missing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("where: {tag: \"feature\"}")) {
          return {
            posts: {
              edges: [
                {
                  node: {
                    slug: "feature-post-fallback",
                    title: "Feature Post Fallback",
                    featuredImage: {
                      node: {
                        sourceUrl: "https://example.com/feature-post-fallback-source.jpg",
                        mediaDetails: {
                          sizes: [
                            { name: "thumbnail", sourceUrl: "https://example.com/feature-post-thumb.jpg" },
                          ],
                        },
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

    expect(html).toContain("Feature Post Fallback");
    expect(html).toContain('src="https://example.com/feature-post-fallback-source.jpg"');
  });

  test("uses all pages sourceUrl when homepage image size is missing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("pages(first: 100)")) {
          return {
            pages: {
              nodes: [
                {
                  id: "feature-page-fallback",
                  slug: "feature-page-fallback",
                  title: "Feature Page Fallback",
                  highlights: { tag: "feature" },
                  featuredImage: {
                    node: {
                      sourceUrl: "https://example.com/all-pages-fallback-source.jpg",
                      mediaDetails: {
                        sizes: [
                          { name: "thumbnail", sourceUrl: "https://example.com/all-pages-thumb.jpg" },
                        ],
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

    expect(html).toContain("Feature Page Fallback");
    expect(html).toContain('src="https://example.com/all-pages-fallback-source.jpg"');
  });

  test("uses roastatistics single-page sourceUrl when homepage image size is missing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("query SinglePage($id: ID!)") && variables.id === "4102") {
          return {
            page: {
              pageId: "4102",
              slug: "page-4102",
              title: "Page 4102",
              featuredImage: {
                node: {
                  sourceUrl: "https://example.com/roastatistics-fallback-source.jpg",
                  mediaDetails: {
                    sizes: [
                      { name: "thumbnail", sourceUrl: "https://example.com/roastatistics-thumb.jpg" },
                    ],
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

    expect(html).toContain("Roastatistics:");
    expect(html).toContain("Page 4102");
    expect(html).toContain('src="https://example.com/roastatistics-fallback-source.jpg"');
  });

  test("renders when locations areas and borough nodes are missing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    fetchGraphQLMock.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        if (query.includes("areas") && query.includes("boroughs")) {
          return {};
        }

        return getDefaultResponseByQuery(query, variables);
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Roast By Location:");
    expect(html).toContain("Search:");
  });
});
