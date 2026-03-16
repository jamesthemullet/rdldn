import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock,
}));

describe("roast-by-tag-section component", () => {
  beforeEach(() => {
    fetchGraphQLMock.mockReset();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  test("renders up to three open posts and uses homepage image fallback", async () => {
    fetchGraphQLMock.mockResolvedValue({
      posts: {
        nodes: [
          {
            slug: "open-post-homepage",
            title: "Open Post Homepage",
            closedDowns: { nodes: [] },
            featuredImage: {
              node: {
                sourceUrl: "https://example.com/open-post-homepage-source.jpg",
                mediaDetails: {
                  sizes: [
                    { name: "thumbnail", sourceUrl: "https://example.com/thumb.jpg" },
                    { name: "homepage", sourceUrl: "https://example.com/homepage.jpg" },
                  ],
                },
              },
            },
            ratings: { nodes: [{ name: "9.2" }] },
            yearsOfVisit: { nodes: [{ name: "2024" }] },
          },
          {
            slug: "closed-post",
            title: "Closed Post",
            closedDowns: { nodes: [{ id: "1" }] },
            featuredImage: {
              node: {
                sourceUrl: "https://example.com/closed.jpg",
                mediaDetails: {
                  sizes: [{ name: "homepage", sourceUrl: "https://example.com/closed-homepage.jpg" }],
                },
              },
            },
            ratings: { nodes: [{ name: "3.1" }] },
            yearsOfVisit: { nodes: [{ name: "2020" }] },
          },
          {
            slug: "open-post-source-fallback",
            title: "Open Post Source Fallback",
            closedDowns: { nodes: [] },
            featuredImage: {
              node: {
                sourceUrl: "https://example.com/source-fallback.jpg",
                mediaDetails: {
                  sizes: [{ name: "thumbnail", sourceUrl: "https://example.com/thumb-2.jpg" }],
                },
              },
            },
            ratings: { nodes: [{ name: "8.4" }] },
            yearsOfVisit: { nodes: [{ name: "2023" }] },
          },
          {
            slug: "open-post-third",
            title: "Open Post Third",
            closedDowns: { nodes: [] },
            featuredImage: {
              node: {
                sourceUrl: "https://example.com/open-post-third-source.jpg",
                mediaDetails: {
                  sizes: [{ name: "homepage", sourceUrl: "https://example.com/open-post-third-homepage.jpg" }],
                },
              },
            },
            ratings: { nodes: [{ name: "7.9" }] },
            yearsOfVisit: { nodes: [{ name: "2022" }] },
          },
        ],
      },
    });

    const container = await AstroContainer.create();
    const { default: RoastByTagSection } = await import("./roast-by-tag-section.astro");
    const html = await container.renderToString(RoastByTagSection, {
      props: { tag: "Camden" },
    });

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);
    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.anything(), { tag: "Camden" });

    expect(html).toContain("Roasts in Camden:");
    expect(html).not.toContain("Closed Post");
    expect(html).toContain("Open Post Homepage");
    expect(html).toContain("Open Post Source Fallback");
    expect(html).toContain("Open Post Third");
    expect(html).toContain('src="https://example.com/homepage.jpg"');
    expect(html).toContain('src="https://example.com/source-fallback.jpg"');

    const items = html.match(/<li[^>]*class="heading"/g) ?? [];
    expect(items).toHaveLength(3);
  });

  test("does not fetch or render when tag is missing", async () => {
    const container = await AstroContainer.create();
    const { default: RoastByTagSection } = await import("./roast-by-tag-section.astro");
    const html = await container.renderToString(RoastByTagSection);

    expect(fetchGraphQLMock).not.toHaveBeenCalled();
    expect(html).not.toContain("roast-by-tag");
  });

  test("includes posts when closedDowns is missing", async () => {
    fetchGraphQLMock.mockResolvedValue({
      posts: {
        nodes: [
          {
            slug: "no-closed-downs-field",
            title: "No Closed Downs Field",
            featuredImage: {
              node: {
                sourceUrl: "https://example.com/no-closed-downs.jpg",
                mediaDetails: {
                  sizes: [{ name: "homepage", sourceUrl: "https://example.com/no-closed-downs-homepage.jpg" }],
                },
              },
            },
            ratings: { nodes: [{ name: "8.0" }] },
            yearsOfVisit: { nodes: [{ name: "2025" }] },
          },
        ],
      },
    });

    const container = await AstroContainer.create();
    const { default: RoastByTagSection } = await import("./roast-by-tag-section.astro");
    const html = await container.renderToString(RoastByTagSection, {
      props: { tag: "Islington" },
    });

    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.anything(), { tag: "Islington" });
    expect(html).toContain("Roasts in Islington:");
    expect(html).toContain("No Closed Downs Field");
  });

  test("renders nothing when posts.nodes is missing", async () => {
    fetchGraphQLMock.mockResolvedValue({
      posts: {},
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const container = await AstroContainer.create();
    const { default: RoastByTagSection } = await import("./roast-by-tag-section.astro");
    const html = await container.renderToString(RoastByTagSection, {
      props: { tag: "Soho" },
    });

    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.anything(), { tag: "Soho" });
    expect(html).not.toContain("roast-by-tag");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test("logs and renders nothing when fetch fails", async () => {
    const error = new Error("query failed");
    fetchGraphQLMock.mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const container = await AstroContainer.create();
    const { default: RoastByTagSection } = await import("./roast-by-tag-section.astro");
    const html = await container.renderToString(RoastByTagSection, {
      props: { tag: "Hackney" },
    });

    expect(fetchGraphQLMock).toHaveBeenCalledWith(expect.anything(), { tag: "Hackney" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching other posts:", error);
    expect(html).not.toContain("roast-by-tag");
  });
});