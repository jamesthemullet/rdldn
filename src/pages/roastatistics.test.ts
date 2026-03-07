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

const createFeaturedImageNode = ({
  sourceUrl,
  homepageUrl,
}: {
  sourceUrl: string;
  homepageUrl?: string;
}) => ({
  node: {
    sourceUrl,
    mediaDetails: {
      sizes: homepageUrl
        ? [
          {
            name: "homepage",
            sourceUrl: homepageUrl,
          },
        ]
        : [],
    },
  },
});

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("roastatistics page", () => {
  test("renders page content and roastatistics list from GraphQL", async () => {
    fetchGraphQLMock.mockImplementation(async (query: string) => {
      if (query.includes("query SinglePage($id: ID!)")) {
        return {
          page: {
            pageId: "4102",
            title: "Roastatistics",
            content: "<p>Welcome to roastatistics.</p>",
            featuredImage: createFeaturedImageNode({
              sourceUrl: "https://example.com/featured.jpg",
              homepageUrl: "https://example.com/featured-homepage.jpg",
            }),
            comments: {
              nodes: [],
            },
            seo: {
              opengraphDescription: "Roastatistics description",
              opengraphImage: {
                sourceUrl: "https://example.com/og.jpg",
              },
            },
          },
        };
      }

      if (query.includes("pages(first: 100)")) {
        return {
          pages: {
            nodes: [
              {
                id: "rs-1",
                slug: "best-yorkshire-puddings",
                title: "Best Yorkshire Puddings",
                highlights: { tag: "roastatistics" },
                featuredImage: createFeaturedImageNode({
                  sourceUrl: "https://example.com/yorkshire-source.jpg",
                  homepageUrl: "https://example.com/yorkshire-homepage.jpg",
                }),
              },
              {
                id: "rs-2",
                slug: "best-gravy",
                title: "Best Gravy",
                highlights: { tag: "roastatistics" },
                featuredImage: createFeaturedImageNode({
                  sourceUrl: "https://example.com/gravy-source.jpg",
                }),
              },
              {
                id: "feature-1",
                slug: "feature-page",
                title: "Feature Page",
                highlights: { tag: "feature" },
                featuredImage: createFeaturedImageNode({
                  sourceUrl: "https://example.com/feature.jpg",
                  homepageUrl: "https://example.com/feature-homepage.jpg",
                }),
              },
            ],
          },
        };
      }

      throw new Error(`Unhandled query in test mock: ${query.slice(0, 60)}`);
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./roastatistics.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.stringContaining("SinglePage"), {
      id: "4102",
    });
    expect(html).toContain("Roastatistics");
    expect(html).toContain("Welcome to roastatistics.");
    expect(html).toContain("href=\"/best-yorkshire-puddings\"");
    expect(html).toContain("href=\"/best-gravy\"");
    expect(html).not.toContain("href=\"/feature-page\"");
    expect(html).toContain('src="https://example.com/yorkshire-homepage.jpg"');
    expect(html).toContain('src="https://example.com/gravy-source.jpg"');
    expect(html).toContain('loading="eager"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain("Got some roastatistics that you'd like to see?");
    expect(html).toContain("No comments yet. Be the first to comment!");
  });

  test("continues rendering when roastatistics list query fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(async (query: string) => {
      if (query.includes("query SinglePage($id: ID!)")) {
        return {
          page: {
            pageId: "4102",
            title: "Roastatistics",
            content: "<p>Welcome to roastatistics.</p>",
            featuredImage: createFeaturedImageNode({
              sourceUrl: "https://example.com/featured.jpg",
              homepageUrl: "https://example.com/featured-homepage.jpg",
            }),
            comments: {
              nodes: [],
            },
            seo: {
              opengraphDescription: "Roastatistics description",
              opengraphImage: {
                sourceUrl: "https://example.com/og.jpg",
              },
            },
          },
        };
      }

      if (query.includes("pages(first: 100)")) {
        throw new Error("All pages query failed");
      }

      throw new Error(`Unhandled query in test mock: ${query.slice(0, 60)}`);
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./roastatistics.astro");
    const html = await container.renderToString(Page);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching features data:",
      expect.any(Error)
    );
    expect(html).toContain("Roastatistics");
    expect(html).toContain("Welcome to roastatistics.");
    expect(html).not.toContain("class=\"heading\"");
  });

  test("throws when single page query fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchGraphQLMock.mockImplementation(async (query: string) => {
      if (query.includes("query SinglePage($id: ID!)")) {
        throw new Error("Single page query failed");
      }

      if (query.includes("pages(first: 100)")) {
        return {
          pages: {
            nodes: [],
          },
        };
      }

      throw new Error(`Unhandled query in test mock: ${query.slice(0, 60)}`);
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./roastatistics.astro");

    await expect(container.renderToString(Page)).rejects.toThrow("No single page data found");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching GraphQL data:",
      expect.any(Error)
    );
  });
});
