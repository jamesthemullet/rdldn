import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();
const getSinglePageDataMock = vi.fn();

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock
}));

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: getSinglePageDataMock
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
  fetchGraphQLMock.mockReset();
  getSinglePageDataMock.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("tube-stations-with-roast-dinner-reviews page", () => {
  test("fetches paginated roast posts and renders best post per station", async () => {
    getSinglePageDataMock.mockResolvedValue({
      pageId: "6781",
      title: "Tube Stations With Roast Dinner Reviews",
      content: "<p>Station coverage intro</p>",
      comments: { nodes: [] },
      seo: {
        opengraphDescription: "Tube station roast map.",
        opengraphImage: { sourceUrl: "https://example.com/tube-og.jpg" }
      },
      featuredImage: { node: { sourceUrl: "https://example.com/tube.jpg" } }
    });

    fetchGraphQLMock.mockImplementation(async (_query: string, variables: Record<string, unknown> = {}) => {
      if (!variables.after) {
        return {
          posts: {
            nodes: [
              {
                title: "Waterloo Winner",
                slug: "waterloo-winner",
                tubeStations: { nodes: [{ name: "Waterloo" }] },
                ratings: { nodes: [{ name: "9.0" }] },
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
              },
              {
                title: "Waterloo Runner Up",
                slug: "waterloo-runner-up",
                tubeStations: { nodes: [{ name: "Waterloo" }] },
                ratings: { nodes: [{ name: "8.0" }] },
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
              },
              {
                title: "Guide Post",
                slug: "guide-post",
                tubeStations: { nodes: [{ name: "Oxford Circus" }] },
                ratings: { nodes: [{ name: "10.0" }] },
                typesOfPost: { nodes: [{ name: "Guide" }] }
              },
              {
                title: "No Rating Oxford",
                slug: "no-rating-oxford",
                tubeStations: { nodes: [{ name: "Oxford Circus" }] },
                ratings: { nodes: [] },
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
              }
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: "cursor-1"
            }
          }
        };
      }

      return {
        posts: {
          nodes: [
            {
              title: "Oxford Supreme",
              slug: "oxford-supreme",
              tubeStations: { nodes: [{ name: "Oxford Circus" }] },
              ratings: { nodes: [{ name: "7.0" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
            },
            {
              title: "Stratford Roast",
              slug: "stratford-roast",
              tubeStations: { nodes: [{ name: "Stratford" }] },
              ratings: { nodes: [{ name: "6.0" }] },
              typesOfPost: { nodes: [{ name: "Roast Dinner" }] }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        }
      };
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./tube-stations-with-roast-dinner-reviews.astro");
    const html = await container.renderToString(Page);

    expect(getSinglePageDataMock).toHaveBeenCalledWith({ variables: { id: "6781" } });
    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Tube Stations With Roast Dinner Reviews");
    expect(html).toContain("Station coverage intro");
    expect(html).toContain("Waterloo Winner");
    expect(html).not.toContain("Waterloo Runner Up");
    expect(html).toContain("Oxford Supreme");
    expect(html).not.toContain("No Rating Oxford");
    expect(html).not.toContain("Guide Post");
    expect(html).toContain("Bakerloo Line stations visited");
    expect(html).toContain("Overground stations visited");
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
  });
});
