import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "12272",
  title: "Best Roast Dinners On The Elizabeth Line",
  content: "<p>Elizabeth intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Elizabeth description",
    opengraphImage: { sourceUrl: "https://example.com/elizabeth-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/elizabeth.jpg" } }
};

const mockRoastPosts = [
  {
    title: "Paddington Roast",
    slug: "paddington-roast",
    tubeStations: { nodes: [{ name: "Paddington" }] },
    ratings: { nodes: [{ name: "8.7" }] },
    closedDowns: { nodes: [] }
  },
  {
    title: "Not On Elizabeth",
    slug: "not-on-elizabeth",
    tubeStations: { nodes: [{ name: "Not On Elizabeth" }] },
    ratings: { nodes: [{ name: "9.0" }] },
    closedDowns: { nodes: [] }
  }
];

vi.mock("../components/header/HeaderAuth");

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

describe("best-roast-dinners-on-the-elizabeth-line page", () => {
  test("renders Elizabeth line content and station-matched post", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-on-the-elizabeth-line.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners On The Elizabeth Line");
    expect(html).toContain("Roast Dinners On The Elizabeth Line");
    expect(html).toContain("Paddington Roast");
    expect(html).not.toContain("Not On Elizabeth");
    expect(html).toContain("Any comments?");
  });
});
