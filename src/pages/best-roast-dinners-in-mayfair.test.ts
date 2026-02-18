import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "8596",
  title: "Best Roast Dinners in Mayfair",
  content: "<p>Mayfair intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Mayfair description",
    opengraphImage: { sourceUrl: "https://example.com/mayfair-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/mayfair.jpg" } }
};

const mockPosts = [
  {
    title: "Mayfair Roast",
    slug: "mayfair-roast",
    tags: { nodes: [{ name: "Mayfair" }] },
    closedDowns: { nodes: [] },
    highlights: { loved: "Silky gravy" },
    ratings: { nodes: [{ name: "8.7" }] },
    yearsOfVisit: { nodes: [{ name: "2024" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/m1.jpg", altText: "Mayfair Roast" } }
  },
  {
    title: "Not Mayfair",
    slug: "not-mayfair",
    tags: { nodes: [{ name: "Soho" }] },
    closedDowns: { nodes: [] },
    ratings: { nodes: [{ name: "9.1" }] }
  }
];

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => mockPage)
}));

vi.mock("../lib/api", () => ({
  fetchGraphQL: vi.fn(async () => ({
    posts: { nodes: mockPosts, pageInfo: { hasNextPage: false, endCursor: null } }
  }))
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

describe("best-roast-dinners-in-mayfair page", () => {
  test("renders Mayfair page and filters to Mayfair roasts", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-in-mayfair.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners in Mayfair");
    expect(html).toContain("Mayfair Roast");
    expect(html).not.toContain("Not Mayfair");
    expect(html).toContain("Any comments?");
  });
});
