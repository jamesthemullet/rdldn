import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "6947",
  title: "Best Roast Dinners On The Bakerloo Line",
  content: "<p>Bakerloo intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Bakerloo description",
    opengraphImage: { sourceUrl: "https://example.com/bakerloo-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/bakerloo.jpg" } }
};

const mockRoastPosts = [
  {
    title: "Waterloo Roast",
    slug: "waterloo-roast",
    tubeStations: { nodes: [{ name: "Waterloo" }] },
    ratings: { nodes: [{ name: "8.4" }] },
    closedDowns: { nodes: [] }
  },
  {
    title: "Off Route Roast",
    slug: "off-route-roast",
    tubeStations: { nodes: [{ name: "Not On Bakerloo" }] },
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

describe("best-roast-dinners-on-the-bakerloo-line page", () => {
  test("renders Bakerloo line content and station-matched post", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-on-the-bakerloo-line.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners On The Bakerloo Line");
    expect(html).toContain("Roast Dinners On The Bakerloo Line");
    expect(html).toContain("Waterloo Roast");
    expect(html).not.toContain("Off Route Roast");
    expect(html).toContain("Any comments?");
  });
});
