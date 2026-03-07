import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const getSinglePageDataMock = vi.fn();
const getAllRoastDinnerPostsMock = vi.fn();

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: getSinglePageDataMock
}));

vi.mock("../lib/getAllRoastDinnerPosts", () => ({
  getAllRoastDinnerPosts: getAllRoastDinnerPostsMock
}));

vi.mock("../lib/api", () => ({
  fetchGraphQL: vi.fn()
}));

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

beforeEach(() => {
  getSinglePageDataMock.mockReset();
  getAllRoastDinnerPostsMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("where-to-get-an-indian-roast-dinner-in-london page", () => {
  test("renders top Indian roast posts only", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T00:00:00.000Z"));

    getSinglePageDataMock.mockResolvedValue({
      id: "page-indian",
      pageId: "9887",
      slug: "where-to-get-an-indian-roast-dinner-in-london",
      title: "Where To Get An Indian Roast Dinner In London",
      content: "<p>Find standout Indian-influenced roast dinners.</p>",
      featuredImage: { node: { sourceUrl: "https://example.com/indian-hero.jpg" } },
      comments: { nodes: [] },
      seo: {
        opengraphDescription: "Best Indian roast dinners in London.",
        opengraphImage: { sourceUrl: "https://example.com/indian-og.jpg" }
      }
    });

    getAllRoastDinnerPostsMock.mockResolvedValue([
      {
        title: "Indian Sunday Star",
        slug: "indian-sunday-star",
        typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
        features: { nodes: [{ name: "indian" }] },
        ratings: { nodes: [{ name: "9.1" }] },
        closedDowns: { nodes: [] },
        highlights: { loved: "Spiced gravy", loathed: "Nothing" }
      },
      {
        title: "Not Indian",
        slug: "not-indian",
        typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
        features: { nodes: [{ name: "gastropub" }] },
        ratings: { nodes: [{ name: "9.8" }] },
        closedDowns: { nodes: [] }
      }
    ]);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./where-to-get-an-indian-roast-dinner-in-london.astro");
    const html = await container.renderToString(Page);

    expect(getSinglePageDataMock).toHaveBeenCalledWith({ variables: { id: "9887" } });
    expect(getAllRoastDinnerPostsMock).toHaveBeenCalledTimes(1);

    expect(html).toContain("Where To Get An Indian Roast Dinner In London");
    expect(html).toContain("Indian Sunday Star");
    expect(html).not.toContain("Not Indian");
    expect(html).toContain("Know any other Indian roast dinners in London?");
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners in London/);
  });
});
