import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

const mockPage = {
  pageId: "5612",
  title: "Best Roast Dinner in South West London",
  content: "<p>South West intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "South West description",
    opengraphImage: { sourceUrl: "https://example.com/sw-og.jpg" }
  }
};

vi.mock("../lib/graphql", () => ({
  fetchPageData: vi.fn(async () => mockPage)
}));

vi.mock("../lib/api", () => ({
  fetchGraphQL: vi.fn(async () => ({
    posts: {
      nodes: [
        {
          title: "South West Star",
          slug: "south-west-star",
          boroughs: { nodes: [{ name: "Wandsworth" }] },
          closedDowns: { nodes: [] },
          ratings: { nodes: [{ name: "8.7" }] },
          highlights: { loved: "Great crackling", loathed: "None" },
          yearsOfVisit: { nodes: [{ name: "2024" }] },
          featuredImage: {
            node: { sourceUrl: "https://example.com/sw-star.jpg", altText: "SW" }
          }
        },
        {
          title: "Wrong Borough Roast",
          slug: "wrong-borough",
          boroughs: { nodes: [{ name: "Camden" }] },
          closedDowns: { nodes: [] },
          ratings: { nodes: [{ name: "9.1" }] }
        },
        {
          title: "Closed South West Roast",
          slug: "closed-sw",
          boroughs: { nodes: [{ name: "Kingston" }] },
          closedDowns: { nodes: [{ name: "yes" }] },
          ratings: { nodes: [{ name: "8.8" }] }
        }
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null
      }
    }
  }))
}));

describe("best-roast-dinner-in-south-west-london page", () => {
  test("renders only valid south-west roasts", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinner-in-south-west-london.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinner in South West London");
    expect(html).toContain("South West Star");
    expect(html).not.toContain("Wrong Borough Roast");
    expect(html).not.toContain("Closed South West Roast");
    expect(html).not.toContain("Also Worth a Try");
    expect(html).toContain("Any comments?");
  });
});
