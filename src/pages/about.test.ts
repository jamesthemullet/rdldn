import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

const mockPage = {
  id: "page-about",
  pageId: "2",
  title: "About Roast Dinners in London",
  content: "<p>We review the best roast dinners in London.</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/about.jpg",
      altText: "About"
    }
  },
  comments: {
    nodes: []
  },
  seo: {
    opengraphImage: { sourceUrl: "https://example.com/about-og.jpg" },
    opengraphDescription: "About page description"
  }
};

vi.mock("../lib/graphql", () => {
  return {
    fetchPageData: vi.fn(async () => mockPage)
  };
});

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("about page", () => {
  test("renders content and comments block", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T00:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: Page } = await import("./about.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("About Roast Dinners in London");
    expect(html).toContain("We review the best roast dinners in London.");
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners in London/);
  });
});