import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "8730",
  title: "Best Roast Dinners in Irish Pubs in London",
  content: "<p>Irish pub intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Irish pub description",
    opengraphImage: { sourceUrl: "https://example.com/irish-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/irish.jpg" } }
};

const mockPosts = [
  {
    title: "Irish Pub Winner",
    slug: "irish-pub-winner",
    tags: { nodes: [{ name: "Irish Pub" }] },
    closedDowns: { nodes: [] },
    highlights: { loved: "Comforting plate" },
    ratings: { nodes: [{ name: "7.8" }] },
    yearsOfVisit: { nodes: [{ name: "2022" }] },
    featuredImage: { node: { sourceUrl: "https://example.com/i1.jpg", altText: "Irish Pub Winner" } }
  },
  {
    title: "Not Irish Pub",
    slug: "not-irish-pub",
    tags: { nodes: [{ name: "Hackney" }] },
    closedDowns: { nodes: [] },
    ratings: { nodes: [{ name: "8.5" }] }
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

describe("best-roast-dinners-in-irish-pubs-in-london page", () => {
  test("renders Irish pub page and filters to Irish Pub tag", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-in-irish-pubs-in-london.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners in Irish Pubs in London");
    expect(html).toContain("Irish Pub Winner");
    expect(html).not.toContain("Not Irish Pub");
    expect(html).toContain("Any comments?");
  });
});
