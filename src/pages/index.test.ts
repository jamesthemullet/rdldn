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

const image = (url: string) => ({
  node: { sourceUrl: url, mediaDetails: { sizes: [{ name: "homepage", sourceUrl: url }] } },
});

const pageIds = ["267", "631", "10368", "17", "5614", "5612", "5616", "5594", "4102"];

const defaultResponse = (query: string) => {
  if (query.includes("HomepageLatestPosts")) {
    return {
      posts: {
        nodes: [
          {
            slug: "latest-roast",
            title: "Latest Roast",
            date: "2026-10-01T12:00:00",
            featuredImage: image("https://example.com/latest.jpg"),
            seo: { opengraphImage: { sourceUrl: "https://example.com/latest-og.jpg" } },
          },
          {
            slug: "other-roast",
            title: "Other Roast",
            date: "2026-09-01T12:00:00",
            featuredImage: image("https://example.com/other.jpg"),
          },
        ],
      },
    };
  }

  if (query.includes("HomepagePages")) {
    return Object.fromEntries(
      pageIds.map((id) => [
        `p${id}`,
        { slug: `page-${id}`, title: `Page ${id}`, featuredImage: image(`https://example.com/page-${id}.jpg`) },
      ])
    );
  }

  if (query.includes('tag: "best"')) {
    return {
      posts: {
        nodes: [
          {
            slug: "best-roast",
            title: "Best Roast",
            featuredImage: image("https://example.com/best.jpg"),
            ratings: { nodes: [{ name: "9.5" }] },
            yearsOfVisit: { nodes: [{ name: "2025" }] },
          },
        ],
      },
    };
  }

  if (query.includes('tag: "feature"')) {
    return {
      posts: {
        edges: [{ node: { slug: "feature-post", title: "Feature Post", featuredImage: image("https://example.com/feature.jpg") } }],
      },
    };
  }

  if (query.includes("pages(first: 100)")) {
    return {
      pages: {
        nodes: [
          { slug: "stats-page", title: "Stats Page", highlights: { tag: "roastatistics" }, featuredImage: image("https://example.com/stats.jpg") },
          { slug: "feature-page", title: "Feature Page", highlights: { tag: "feature" }, featuredImage: image("https://example.com/feature-page.jpg") },
        ],
      },
    };
  }

  throw new Error(`Unhandled query in test mock: ${query.slice(0, 60)}`);
};

const renderHomepage = async () => {
  const container = await AstroContainer.create();
  const { default: Page } = await import("./index.astro");
  return container.renderToString(Page);
};

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("index page", () => {
  test("server-renders every section in a single pass", async () => {
    fetchGraphQLMock.mockImplementation(async (query: string) => defaultResponse(query));

    const html = await renderHomepage();

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(5);

    expect(html).toContain("Latest Reviews:");
    expect(html).toContain("Latest Roast");
    expect(html).toContain("Other Roast");
    expect(html).toContain('data-post-date="2026-10-01T12:00:00"');

    expect(html).toContain("Find Your Favourite Roast:");
    expect(html).toContain('href="/page-267"');
    expect(html).toContain("Roast By Location:");
    expect(html).toContain('href="/page-5614"');

    expect(html).toContain("Interactive:");
    expect(html).toContain("Search:");
    expect(html).toContain('data-result-limit="4"');

    expect(html).toContain("A few of the best roasts:");
    expect(html).toContain("Best Roast");
    expect(html).toContain("Rating: 9.5");
    expect(html).toContain("Year Visited: 2025");

    expect(html).toContain("Features:");
    expect(html).toContain("Feature Post");
    expect(html).toContain("Feature Page");

    expect(html).toContain("Roastatistics:");
    expect(html).toContain("Page 4102");
    expect(html).toContain("Stats Page");

    // No content depends on a client-side fetch any more
    expect(html).not.toContain("x-data=\"homepageHighlights\"");
  });

  test("keeps rendering the other sections when one query fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchGraphQLMock.mockImplementation(async (query: string) => {
      if (query.includes("HomepageLatestPosts")) throw new Error("Latest posts failed");
      return defaultResponse(query);
    });

    const html = await renderHomepage();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching homepage latest posts:",
      expect.any(Error)
    );
    expect(html).not.toContain("Latest Reviews:");
    expect(html).toContain("Find Your Favourite Roast:");
    expect(html).toContain("Roast By Location:");
    expect(html).toContain("A few of the best roasts:");
    expect(html).toContain("Features:");
    expect(html).toContain("Roastatistics:");
  });

  test("still renders static sections when the GraphQL backend is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchGraphQLMock.mockRejectedValue(new Error("Backend down"));

    const html = await renderHomepage();

    expect(html).toContain("Interactive:");
    expect(html).toContain("Find A Roast");
    expect(html).toContain("Search:");
    expect(html).not.toContain("Latest Reviews:");
  });
});
