import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("../components/header/HeaderAuth");

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  ),
}));

vi.mock("@clerk/astro/react", () => ({
  useAuth: vi.fn(() => ({ isSignedIn: false, isLoaded: true })),
}));

vi.mock("../lib/api", () => ({
  fetchGraphQL: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

const makePost = ({
  title,
  slug,
  typeOfPost = "Roast Dinner",
  isClosed = false,
}: {
  title: string;
  slug: string;
  typeOfPost?: string;
  isClosed?: boolean;
}) => ({
  slug,
  title,
  date: "2026-01-01",
  typesOfPost: { nodes: [{ name: typeOfPost }] },
  closedDowns: { nodes: isClosed ? [{ name: "closeddown" }] : [] },
  ratings: { nodes: [{ name: "8.0" }] },
  prices: { nodes: [{ name: "£18" }] },
  yearsOfVisit: { nodes: [{ name: "2024" }] },
});

describe("find-a-roast page", () => {
  test("renders the page title and open-post count excluding closed and non-roast posts", async () => {
    const { fetchGraphQL } = await import("../lib/api");
    vi.mocked(fetchGraphQL).mockResolvedValueOnce({
      posts: {
        nodes: [
          makePost({ title: "Open Pub A", slug: "open-pub-a" }),
          makePost({ title: "Closed Pub", slug: "closed-pub", isClosed: true }),
          makePost({ title: "Not A Roast", slug: "not-a-roast", typeOfPost: "Pub Review" }),
        ],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./find-a-roast.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Find A Roast");
    // 1 open roast dinner post — closed and non-roast posts must be excluded
    expect(html).toContain("1 reviewed restaurants");
  });

  test("accumulates roast dinner posts across multiple pages of GraphQL results", async () => {
    const { fetchGraphQL } = await import("../lib/api");
    vi.mocked(fetchGraphQL)
      .mockResolvedValueOnce({
        posts: {
          nodes: [makePost({ title: "Page One Pub", slug: "page-one-pub" })],
          pageInfo: { hasNextPage: true, endCursor: "cursor-1" },
        },
      })
      .mockResolvedValueOnce({
        posts: {
          nodes: [makePost({ title: "Page Two Pub", slug: "page-two-pub" })],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      });

    const container = await AstroContainer.create();
    const { default: Page } = await import("./find-a-roast.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("2 reviewed restaurants");
  });
});
