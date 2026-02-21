import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "7038",
  title: "Best Roast Dinners On The Piccadilly Line",
  content: "<p>Piccadilly intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Piccadilly description",
    opengraphImage: { sourceUrl: "https://example.com/piccadilly-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/piccadilly.jpg" } }
};

const mockRoastPosts = [
  {
    title: "Covent Garden Roast",
    slug: "covent-garden-roast",
    tubeStations: { nodes: [{ name: "Covent Garden" }] },
    ratings: { nodes: [{ name: "8.8" }] },
    closedDowns: { nodes: [] }
  },
  {
    title: "Not On Piccadilly",
    slug: "not-on-piccadilly",
    tubeStations: { nodes: [{ name: "Not On Piccadilly" }] },
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

describe("best-roast-dinners-on-the-piccadilly-line page", () => {
  test("renders Piccadilly line content and station-matched post", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-on-the-piccadilly-line.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners On The Piccadilly Line");
    expect(html).toContain("Roast Dinners On The Piccadilly Line");
    expect(html).toContain("Covent Garden Roast");
    expect(html).not.toContain("Not On Piccadilly");
    expect(html).toContain("Any comments?");
  });
});
