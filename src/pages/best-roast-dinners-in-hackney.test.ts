import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "11586",
  title: "Best Roast Dinners in Hackney",
  content: "<p>Hackney intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Hackney description",
    opengraphImage: { sourceUrl: "https://example.com/hackney-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/hackney.jpg" } }
};

const mockPosts = [
  {
    title: "Hackney Hero",
    slug: "hackney-hero",
    tags: { nodes: [{ name: "Hackney" }] },
    closedDowns: { nodes: [] },
    highlights: { loved: "Crispy potatoes" },
    ratings: { nodes: [{ name: "8.8" }] },
    yearsOfVisit: { nodes: [{ name: "2023" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/h1.jpg", altText: "Hackney Hero" } }
  },
  {
    title: "Not Hackney",
    slug: "not-hackney",
    tags: { nodes: [{ name: "Islington" }] },
    closedDowns: { nodes: [] },
    ratings: { nodes: [{ name: "9.2" }] }
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

describe("best-roast-dinners-in-hackney page", () => {
  test("renders Hackney page and filters to Hackney roasts", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-in-hackney.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners in Hackney");
    expect(html).toContain("Hackney Hero");
    expect(html).not.toContain("Not Hackney");
    expect(html).toContain("Any comments?");
  });
});
