import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

const mockSinglePage = {
  pageId: "10368",
  title: "Best Roast Lists",
  content: "<p>All the best roast dinner lists.</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Best roast list index",
    opengraphImage: { sourceUrl: "https://example.com/lists-og.jpg" }
  },
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/lists-hero.jpg"
    }
  }
};

const mockPages = [
  {
    slug: "best-roast-dinner-in-west-london",
    title: "Best Roast Dinner In West London",
    highlights: { tag: "best-area" },
    featuredImage: {
      node: {
        sourceUrl: "https://example.com/west-full.jpg",
        mediaDetails: {
          sizes: [{ name: "homepage", sourceUrl: "https://example.com/west-homepage.jpg" }]
        }
      }
    }
  },
  {
    slug: "best-roast-dinners-on-the-central-line",
    title: "Best Roast Dinners On The Central Line",
    highlights: { tag: "best-location" },
    featuredImage: {
      node: {
        sourceUrl: "https://example.com/central-full.jpg",
        mediaDetails: {
          sizes: [{ name: "homepage", sourceUrl: "https://example.com/central-homepage.jpg" }]
        }
      }
    }
  },
  {
    slug: "best-gravy-in-london",
    title: "Best Gravy In London",
    highlights: { tag: "best" },
    featuredImage: {
      node: {
        sourceUrl: "https://example.com/gravy-full.jpg",
        mediaDetails: {
          sizes: []
        }
      }
    }
  },
  {
    slug: "ignore-me",
    title: "Not A Best List",
    highlights: { tag: "other" },
    featuredImage: {
      node: {
        sourceUrl: "https://example.com/ignore.jpg",
        mediaDetails: {
          sizes: []
        }
      }
    }
  }
];

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock
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
  })()
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  vi.resetModules();

  fetchGraphQLMock.mockImplementation(async (_query: string, variables?: { id?: string }) => {
    if (variables?.id) {
      return { page: mockSinglePage };
    }

    return {
      pages: {
        nodes: mockPages
      }
    };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("best-roast-lists page", () => {
  test("renders both sections and places line pages in tube-line section", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-lists.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Lists");
    expect(html).toContain("Best Roasts In...");
    expect(html).toContain("Best Roast Dinners on Tube Lines");

    const bestRoastsSectionStart = html.indexOf("Best Roasts In...");
    const tubeLinesSectionStart = html.indexOf("Best Roast Dinners on Tube Lines");
    const bestRoastsSection = html.slice(bestRoastsSectionStart, tubeLinesSectionStart);
    const tubeLinesSection = html.slice(tubeLinesSectionStart);

    expect(bestRoastsSection).toContain("Best Roast Dinner In West London");
    expect(bestRoastsSection).toContain("Best Gravy In London");
    expect(bestRoastsSection).not.toContain("Best Roast Dinners On The Central Line");

    expect(tubeLinesSection).toContain("Best Roast Dinners On The Central Line");
    expect(tubeLinesSection).not.toContain("Best Roast Dinner In West London");
    expect(html).not.toContain("Not A Best List");
    expect(html).toContain("Any comments?");
  });

  test("uses homepage image size when available and falls back to sourceUrl", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-lists.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("https://example.com/west-homepage.jpg");
    expect(html).toContain("https://example.com/gravy-full.jpg");
  });

  test("logs and still renders when fetching best list pages fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    fetchGraphQLMock.mockImplementation(async (_query: string, variables?: { id?: string }) => {
      if (variables?.id) {
        return { page: mockSinglePage };
      }

      throw new Error("features fetch failed");
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-lists.astro");
    const html = await container.renderToString(Page);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching features data:",
      expect.any(Error)
    );
    expect(html).toContain("Best Roast Lists");
    expect(html).toContain("Best Roasts In...");
    expect(html).toContain("Best Roast Dinners on Tube Lines");
    expect(html).not.toContain("Best Roast Dinner In West London");
    expect(html).toContain("Any comments?");
  });
});
