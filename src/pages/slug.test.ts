import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

const makeResponse = (data: unknown) => ({
  json: async () => ({ data })
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("[slug] getStaticPaths", () => {
  test("returns combined post and page paths", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({
        posts: {
          nodes: [{ slug: "post-1" }],
          pageInfo: { hasNextPage: false, endCursor: null }
        }
      }))
      .mockResolvedValueOnce(makeResponse({
        pages: {
          nodes: [{ slug: "page-1" }],
          pageInfo: { hasNextPage: false, endCursor: null }
        }
      }));

    vi.stubGlobal("fetch", fetchMock);

    const { getStaticPaths } = await import("./[slug].astro");
    const paths = await getStaticPaths();

    expect(paths).toHaveLength(2);
    expect(paths).toEqual([
      { params: { slug: "post-1" }, props: { contentType: "post" } },
      { params: { slug: "page-1" }, props: { contentType: "page" } }
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("paginates posts and pages", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({
        posts: {
          nodes: [{ slug: "post-1" }],
          pageInfo: { hasNextPage: true, endCursor: "cursor-post" }
        }
      }))
      .mockResolvedValueOnce(makeResponse({
        posts: {
          nodes: [{ slug: "post-2" }],
          pageInfo: { hasNextPage: false, endCursor: null }
        }
      }))
      .mockResolvedValueOnce(makeResponse({
        pages: {
          nodes: [{ slug: "page-1" }],
          pageInfo: { hasNextPage: true, endCursor: "cursor-page" }
        }
      }))
      .mockResolvedValueOnce(makeResponse({
        pages: {
          nodes: [{ slug: "page-2" }],
          pageInfo: { hasNextPage: false, endCursor: null }
        }
      }));

    vi.stubGlobal("fetch", fetchMock);

    const { getStaticPaths } = await import("./[slug].astro");
    const paths = await getStaticPaths();

    expect(paths).toHaveLength(4);
    expect(paths).toEqual([
      { params: { slug: "post-1" }, props: { contentType: "post" } },
      { params: { slug: "post-2" }, props: { contentType: "post" } },
      { params: { slug: "page-1" }, props: { contentType: "page" } },
      { params: { slug: "page-2" }, props: { contentType: "page" } }
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  test("handles non-array posts nodes", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({
        posts: {
          nodes: null,
          pageInfo: { hasNextPage: false, endCursor: null }
        }
      }))
      .mockResolvedValueOnce(makeResponse({
        pages: {
          nodes: [],
          pageInfo: { hasNextPage: false, endCursor: null }
        }
      }));

    vi.stubGlobal("fetch", fetchMock);

    const { getStaticPaths } = await import("./[slug].astro");
    const paths = await getStaticPaths();

    expect(paths).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("[slug] render", () => {
  test("renders re-reviewed message and year in price label", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-27T00:00:00.000Z"));

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          post: {
            postId: "1",
            date: "2025-02-02",
            content: "<p>Review content</p>",
            title: "Test Roast",
            featuredImage: { node: { sourceUrl: "https://example.com/img.jpg" } },
            seo: {
              opengraphDescription: "Desc",
              opengraphImage: { sourceUrl: "https://example.com/og.jpg" }
            },
            areas: { nodes: [{ name: "Central" }] },
            boroughs: { nodes: [{ name: "Camden" }] },
            tubeStations: { nodes: [{ name: "Bank" }] },
            tubeLines: { nodes: [{ name: "Central" }] },
            prices: { nodes: [{ name: "£20" }] },
            ratings: { nodes: [{ name: "8.5" }] },
            yearsOfVisit: { nodes: [{ name: "2024" }] },
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            closedDowns: { nodes: [{ name: "re-reviewed-2024" }] },
            nSFWs: { nodes: [] },
            highlights: { loved: "Yorkies", loathed: "None" },
            comments: { nodes: [] }
          }
        }
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./[slug].astro");
    const html = await container.renderToString(Page, {
      params: { slug: "test-roast" },
      props: { contentType: "post" },
      request: new Request("https://rdldn.co.uk/test-roast")
    });

    expect(html).toContain("Re-reviewed: 2024");
    expect(html).toMatch(/Price Paid \(in 2024\):\s*£20/);
    expect(html).toContain("Rating: 8.5");
  });

  test("omits year in price label for current year", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-27T00:00:00.000Z"));

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          post: {
            postId: "2",
            date: "2026-01-01",
            content: "<p>Another review</p>",
            title: "Current Roast",
            featuredImage: { node: { sourceUrl: "https://example.com/img2.jpg" } },
            seo: {
              opengraphDescription: "Desc",
              opengraphImage: { sourceUrl: "https://example.com/og2.jpg" }
            },
            areas: { nodes: [{ name: "West" }] },
            boroughs: { nodes: [{ name: "Hackney" }] },
            tubeStations: { nodes: [{ name: "Aldgate" }] },
            tubeLines: { nodes: [{ name: "Circle" }] },
            prices: { nodes: [{ name: "£25" }] },
            ratings: { nodes: [{ name: "7.0" }] },
            yearsOfVisit: { nodes: [{ name: "2026" }] },
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            closedDowns: { nodes: [{ name: "newowners" }] },
            nSFWs: { nodes: [] },
            highlights: { loved: "Gravy", loathed: "None" },
            comments: { nodes: [] }
          }
        }
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./[slug].astro");
    const html = await container.renderToString(Page, {
      params: { slug: "current-roast" },
      props: { contentType: "post" },
      request: new Request("https://rdldn.co.uk/current-roast")
    });

    expect(html).toContain("Under New Owners");
    expect(html).toMatch(/Price Paid:\s*£25/);
    expect(html).not.toContain("(in 2026)");
  });

  test("renders NSFW warning with reasons", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-27T00:00:00.000Z"));

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          post: {
            postId: "3",
            date: "2025-12-12",
            content: "<p>Spicy review</p>",
            title: "Naughty Roast",
            featuredImage: { node: { sourceUrl: "https://example.com/img3.jpg" } },
            seo: {
              opengraphDescription: "Desc",
              opengraphImage: { sourceUrl: "https://example.com/og3.jpg" }
            },
            areas: { nodes: [{ name: "North" }] },
            boroughs: { nodes: [{ name: "Islington" }] },
            tubeStations: { nodes: [{ name: "Angel" }] },
            tubeLines: { nodes: [{ name: "Northern" }] },
            prices: { nodes: [{ name: "£30" }] },
            ratings: { nodes: [{ name: "6.5" }] },
            yearsOfVisit: { nodes: [{ name: "2025" }] },
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            closedDowns: { nodes: [] },
            nSFWs: { nodes: [{ name: "sweary" }, { name: "rude" }] },
            highlights: { loved: "Roasties", loathed: "None" },
            comments: { nodes: [] }
          }
        }
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./[slug].astro");
    const html = await container.renderToString(Page, {
      params: { slug: "naughty-roast" },
      props: { contentType: "post" },
      request: new Request("https://rdldn.co.uk/naughty-roast")
    });

    expect(html).toMatch(/NSFW: Warning - this review may not be safe for work due to\s*sweary, rude\./);
  });

  test("uses logo3 fallback when no featured image", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-27T00:00:00.000Z"));

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          post: {
            postId: "4",
            date: "2025-11-11",
            content: "<p>No image review</p>",
            title: "Logo Roast",
            featuredImage: null,
            seo: {
              opengraphDescription: "Desc",
              opengraphImage: { sourceUrl: "https://example.com/og4.jpg" }
            },
            areas: { nodes: [{ name: "East" }] },
            boroughs: { nodes: [{ name: "Hackney" }] },
            tubeStations: { nodes: [{ name: "Bethnal Green" }] },
            tubeLines: { nodes: [{ name: "Central" }] },
            prices: { nodes: [{ name: "£18" }] },
            ratings: { nodes: [{ name: "7.5" }] },
            yearsOfVisit: { nodes: [{ name: "2025" }] },
            typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
            closedDowns: { nodes: [] },
            nSFWs: { nodes: [] },
            highlights: { loved: "Roasties", loathed: "None" },
            comments: { nodes: [] }
          }
        }
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./[slug].astro");
    const html = await container.renderToString(Page, {
      params: { slug: "logo-roast" },
      props: { contentType: "post" },
      request: new Request("https://rdldn.co.uk/logo-roast")
    });

    expect(html).toMatch(/logo-3\.png/);
  });

  test("renders page content for contentType page", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-27T00:00:00.000Z"));

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          page: {
            pageId: "99",
            date: "2025-05-05",
            content: "<p>About content</p>",
            title: "About Page",
            featuredImage: { node: { sourceUrl: "https://example.com/page.jpg" } },
            seo: {
              opengraphDescription: "Desc",
              opengraphImage: { sourceUrl: "https://example.com/og-page.jpg" }
            },
            comments: { nodes: [] }
          }
        }
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./[slug].astro");
    const html = await container.renderToString(Page, {
      params: { slug: "about" },
      props: { contentType: "page" },
      request: new Request("https://rdldn.co.uk/about")
    });

    expect(html).toContain("About Page");
    expect(html).toContain("Any comments?");
    expect(html).not.toContain("Skip The Nonsense");
    expect(html).not.toContain("Summary:");
  });

  test("redirects to 404 when post is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ data: { post: null } })
    });

    vi.stubGlobal("fetch", fetchMock);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./[slug].astro");
    const result: unknown = await container.renderToString(Page, {
      params: { slug: "missing-post" },
      props: { contentType: "post" },
      request: new Request("https://rdldn.co.uk/missing-post")
    });

    if (result instanceof Response) {
      expect(result.status).toBe(302);
      expect(result.headers.get("location")).toBe("/404");
    } else {
      expect(result).toBe("");
    }
  });
});
