import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

const mockPage = {
  pageId: "7165",
  title: "Best Roast Dinners On The Central Line",
  content: "<p>Central intro</p>",
  comments: { nodes: [] },
  seo: {
    opengraphDescription: "Central description",
    opengraphImage: { sourceUrl: "https://example.com/central-og.jpg" }
  },
  featuredImage: { node: { sourceUrl: "https://example.com/central.jpg" } }
};

const mockRoastPosts = [
  {
    title: "Bank Roast",
    slug: "bank-roast",
    tubeStations: { nodes: [{ name: "Bank" }] },
    ratings: { nodes: [{ name: "8.1" }] },
    closedDowns: { nodes: [] }
  },
  {
    title: "Not On Central",
    slug: "not-on-central",
    tubeStations: { nodes: [{ name: "Not On Central" }] },
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

describe("best-roast-dinners-on-the-central-line page", () => {
  test("renders Central line content and station-matched post", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-roast-dinners-on-the-central-line.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Best Roast Dinners On The Central Line");
    expect(html).toContain("Roast Dinners On The Central Line");
    expect(html).toContain("Bank Roast");
    expect(html).not.toContain("Not On Central");
    expect(html).toContain("Any comments?");
  });
});
