import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "6980",
  title: "Best Roast Dinners On The Jubilee Line",
  content: "<p>Jubilee intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Jubilee description",
    opengraphImage: { sourceUrl: "https://example.com/jubilee-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/jubilee.jpg" } }
};

const mockRoastPosts = [
  {
    title: "Canary Wharf Roast",
    slug: "canary-wharf-roast",
    tubeStations: { nodes: [{ name: "Canary Wharf" }] },
    ratings: { nodes: [{ name: "8.2" }] },
    closedDowns: { nodes: [] }
  },
  {
    title: "Not On Jubilee",
    slug: "not-on-jubilee",
    tubeStations: { nodes: [{ name: "Not On Jubilee" }] },
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

describe("best-roast-dinners-on-the-jubilee-line page", () => {
  test("renders Jubilee line content and station-matched post", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-on-the-jubilee-line.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners On The Jubilee Line");
    expect(html).toContain("Roast Dinners On The Jubilee Line");
    expect(html).toContain("Canary Wharf Roast");
    expect(html).not.toContain("Not On Jubilee");
    expect(html).toContain("Any comments?");
  });
});
