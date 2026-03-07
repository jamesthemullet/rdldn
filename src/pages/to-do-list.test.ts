import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const getSinglePageDataMock = vi.fn();

const mockPage = {
  id: "page-todo-list",
  pageId: "17",
  slug: "to-do-list",
  title: "To-Do List",
  content: "<p>Roast dinner checklist content.</p>",
  featuredImage: {
    node: {
      sourceUrl: "https://example.com/todo-list-hero.jpg",
      altText: "To-Do List"
    }
  },
  comments: {
    nodes: [
      {
        id: "c1",
        parentId: undefined,
        author: {
          node: {
            name: "Lord Gravy",
            avatar: { url: "https://example.com/avatar-1.png" }
          }
        },
        date: "2025-01-12T12:00:00.000Z",
        content: { rendered: "<p>Top-level comment</p>" }
      },
      {
        id: "c2",
        parentId: "c1",
        author: {
          node: {
            name: "Roast Fan",
            avatar: { url: "https://example.com/avatar-2.png" }
          }
        },
        date: "2025-01-13T12:00:00.000Z",
        content: { rendered: "<p>Reply comment</p>" }
      }
    ]
  },
  seo: {
    opengraphImage: { sourceUrl: "https://example.com/todo-list-og.jpg" },
    opengraphDescription: "To-do list page description"
  }
};

vi.mock("../lib/getSinglePageData", () => ({
  getSinglePageData: getSinglePageDataMock
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
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("to-do-list page", () => {
  test("renders page content, newsletter and threaded comments", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T00:00:00.000Z"));
    getSinglePageDataMock.mockResolvedValue(mockPage);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./to-do-list.astro");
    const html = await container.renderToString(Page);

    expect(getSinglePageDataMock).toHaveBeenCalledWith({ variables: { id: "17" } });
    expect(html).toContain("To-Do List");
    expect(html).toContain("Roast dinner checklist content.");
    expect(html).toContain("Get new roast reviews direct to your inbox");
    expect(html).toContain("Any comments?");
    expect(html).toContain("Lord Gravy");
    expect(html).toContain("Roast Fan");
    expect(html).toContain('data-post-id="17"');
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners in London/);
  });
});
