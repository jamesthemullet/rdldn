import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "7038",
  title: "Best Roast Dinners On The Victoria Line",
  content: "<p>Victoria intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Victoria description",
    opengraphImage: { sourceUrl: "https://example.com/victoria-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/victoria.jpg" } }
};

const mockRoastPosts = [
  {
    title: "Victoria Roast",
    slug: "victoria-roast",
    tubeStations: { nodes: [{ name: "Victoria" }] },
    ratings: { nodes: [{ name: "8.7" }] },
    closedDowns: { nodes: [] }
  },
  {
    title: "Not On Victoria",
    slug: "not-on-victoria",
    tubeStations: { nodes: [{ name: "Not On Victoria" }] },
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

describe("best-roast-dinners-on-the-victoria-line page", () => {
  test("renders Victoria line content and station-matched post", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-on-the-victoria-line.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners On The Victoria Line");
    expect(html).toContain("Roast Dinners On The Victoria Line");
    expect(html).toContain("Victoria Roast");
    expect(html).not.toContain("Not On Victoria");
    expect(html).toContain("Any comments?");
  });
});
