import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock,
}));

vi.mock("../components/best-value/best-value.tsx", () => ({
  default: () => null,
}));

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) => `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  ),
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("best-value-roast-dinners-london page", () => {
  test("fetches paginated posts, excludes closed/non-roast/not-really-london posts, and ranks structured data by value score", async () => {
    fetchGraphQLMock.mockImplementation(
      async (_query: string, variables: Record<string, unknown> = {}) => {
        if (!variables.after) {
          return {
            posts: {
              nodes: [
                {
                  title: "Cheap And Great",
                  slug: "cheap-and-great",
                  typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
                  ratings: { nodes: [{ name: "9" }] },
                  prices: { nodes: [{ name: "£12" }] },
                  yearsOfVisit: { nodes: [{ name: "2024" }] },
                  areas: { nodes: [{ name: "Soho" }] },
                  closedDowns: { nodes: [] },
                },
                {
                  title: "Not A Roast",
                  slug: "not-a-roast",
                  typesOfPost: { nodes: [{ name: "Guide" }] },
                  ratings: { nodes: [{ name: "10" }] },
                  prices: { nodes: [{ name: "£1" }] },
                  closedDowns: { nodes: [] },
                },
                {
                  title: "Combination Type Roast",
                  slug: "combination-type-roast",
                  typesOfPost: { nodes: [{ name: "Roast Dinner" }, { name: "Guide" }] },
                  ratings: { nodes: [{ name: "10" }] },
                  prices: { nodes: [{ name: "£1" }] },
                  closedDowns: { nodes: [] },
                },
              ],
              pageInfo: {
                hasNextPage: true,
                endCursor: "cursor-1",
              },
            },
          };
        }

        return {
          posts: {
            nodes: [
              {
                title: "Closed Roast",
                slug: "closed-roast",
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
                ratings: { nodes: [{ name: "10" }] },
                prices: { nodes: [{ name: "£5" }] },
                closedDowns: { nodes: [{ name: "closeddown" }] },
              },
              {
                title: "Outside London",
                slug: "outside-london",
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
                ratings: { nodes: [{ name: "10" }] },
                prices: { nodes: [{ name: "£5" }] },
                areas: { nodes: [{ name: "Not Really London" }] },
                closedDowns: { nodes: [] },
              },
              {
                title: "Pricey And Mediocre",
                slug: "pricey-and-mediocre",
                typesOfPost: { nodes: [{ name: "Roast Dinner" }] },
                ratings: { nodes: [{ name: "6" }] },
                prices: { nodes: [{ name: "£30" }] },
                yearsOfVisit: { nodes: [{ name: "2024" }] },
                areas: { nodes: [{ name: "Camden" }] },
                closedDowns: { nodes: [] },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        };
      }
    );

    const container = await AstroContainer.create();
    const { default: Page } = await import("./best-value-roast-dinners-london.astro");
    const html = await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), { after: "cursor-1" });

    expect(html).toContain("Best Value Roast Dinners in London");
    expect(html).toContain("cheap roast dinner");

    expect(html).toContain('"@type":"ItemList"');
    expect(html).not.toContain('"name":"Not A Roast"');
    expect(html).not.toContain('"name":"Closed Roast"');
    expect(html).not.toContain('"name":"Outside London"');
    expect(html).not.toContain('"name":"Combination Type Roast"');

    const cheapIndex = html.indexOf('"name":"Cheap And Great"');
    const priceyIndex = html.indexOf('"name":"Pricey And Mediocre"');
    expect(cheapIndex).toBeGreaterThan(-1);
    expect(priceyIndex).toBeGreaterThan(-1);
    expect(cheapIndex).toBeLessThan(priceyIndex);
  });
});
