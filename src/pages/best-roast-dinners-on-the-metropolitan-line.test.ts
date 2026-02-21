import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "7009",
  title: "Best Roast Dinners On The Metropolitan Line",
  content: "<p>Metropolitan intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Metropolitan description",
    opengraphImage: { sourceUrl: "https://example.com/metropolitan-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/metropolitan.jpg" } }
};

const mockRoastPosts = [
  {
    title: "Baker Street Roast",
    slug: "baker-street-roast",
    tubeStations: { nodes: [{ name: "Baker Street" }] },
    ratings: { nodes: [{ name: "8.6" }] },
    closedDowns: { nodes: [] }
  },
  {
    title: "Not On Metropolitan",
    slug: "not-on-metropolitan",
    tubeStations: { nodes: [{ name: "Not On Metropolitan" }] },
    ratings: { nodes: [{ name: "9.0" }] },
    closedDowns: { nodes: [] }
  }
];

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: vi.fn(async () => mockPage)
}));

vi.mock("../lib/getTubeLineRoastPosts", () => ({
  getTubeLineRoastPosts: vi.fn(async () => mockRoastPosts)
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

describe("best-roast-dinners-on-the-metropolitan-line page", () => {
  test("renders Metropolitan line content and station-matched post", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-on-the-metropolitan-line.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners On The Metropolitan Line");
    expect(html).toContain("Roast Dinners On The Metropolitan Line");
    expect(html).toContain("Baker Street Roast");
    expect(html).not.toContain("Not On Metropolitan");
    expect(html).toContain("Any comments?");
  });
});
