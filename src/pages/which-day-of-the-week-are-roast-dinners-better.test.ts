import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchGraphQLMock = vi.fn();

vi.mock("../lib/api", () => ({
  fetchGraphQL: fetchGraphQLMock,
}));

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  ),
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  vi.resetModules();

  fetchGraphQLMock.mockImplementation(
    async (_query: string, variables: Record<string, unknown> = {}) => {
      if (!variables.after) {
        return {
          posts: {
            nodes: [
              // Sunday (0)
              {
                date: "2024-01-07T12:00:00.000Z",
                ratings: { nodes: [{ name: "8.0" }] },
              },
              // Sunday (0) — second, so average = 8.5
              {
                date: "2024-01-14T12:00:00.000Z",
                ratings: { nodes: [{ name: "9.0" }] },
              },
              // Saturday (6)
              {
                date: "2024-01-06T12:00:00.000Z",
                ratings: { nodes: [{ name: "7.5" }] },
              },
              // No rating — should be skipped
              { date: "2024-01-08T12:00:00.000Z", ratings: undefined },
              // Invalid date — should be skipped
              { date: "", ratings: { nodes: [{ name: "9.5" }] } },
              // Non-numeric rating — should be skipped
              {
                date: "2024-01-09T12:00:00.000Z",
                ratings: { nodes: [{ name: "not-a-rating" }] },
              },
            ],
            pageInfo: { hasNextPage: true, endCursor: "cursor-1" },
          },
        };
      }

      return {
        posts: {
          nodes: [
            // Wednesday (3)
            {
              date: "2024-01-10T12:00:00.000Z",
              ratings: { nodes: [{ name: "6.5" }] },
            },
          ],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      };
    }
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("which-day-of-the-week-are-roast-dinners-better page", () => {
  test("renders the page title and description", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import(
      "./which-day-of-the-week-are-roast-dinners-better.astro"
    );
    const html = await container.renderToString(Page);

    expect(html).toContain("Which Day Of The Week Are Roast Dinners Better?");
    expect(html).toContain("Sunday is the classic roast dinner day");
  });

  test("fetches posts with pagination", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import(
      "./which-day-of-the-week-are-roast-dinners-better.astro"
    );
    await container.renderToString(Page);

    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(1, expect.anything(), {});
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(2, expect.anything(), {
      after: "cursor-1",
    });
  });

  test("renders correct average for Sunday (2 reviews: 8.0 and 9.0 = 8.50)", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import(
      "./which-day-of-the-week-are-roast-dinners-better.astro"
    );
    const html = await container.renderToString(Page);

    expect(html).toContain("Sunday");
    expect(html).toContain("8.50");
    expect(html).toMatch(/Sunday[\s\S]*?8\.50[\s\S]*?2 reviews/);
  });

  test("renders correct average for Saturday (1 review: 7.5)", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import(
      "./which-day-of-the-week-are-roast-dinners-better.astro"
    );
    const html = await container.renderToString(Page);

    expect(html).toContain("Saturday");
    expect(html).toMatch(/7\.50[\s\S]*?1 review/);
  });

  test("renders N/A for days with no reviews", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import(
      "./which-day-of-the-week-are-roast-dinners-better.astro"
    );
    const html = await container.renderToString(Page);

    // Monday, Tuesday, Thursday, Friday have no reviews in mock data
    expect(html).toContain("Monday");
    expect(html).toContain("N/A");
  });

  test("renders all seven days of the week", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import(
      "./which-day-of-the-week-are-roast-dinners-better.astro"
    );
    const html = await container.renderToString(Page);

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    for (const day of days) {
      expect(html).toContain(day);
    }
  });

  test("includes bar chart elements", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import(
      "./which-day-of-the-week-are-roast-dinners-better.astro"
    );
    const html = await container.renderToString(Page);

    expect(html).toContain("bar-track");
    expect(html).toContain("bar-fill");
  });

  test("renders newsletter section", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import(
      "./which-day-of-the-week-are-roast-dinners-better.astro"
    );
    const html = await container.renderToString(Page);

    // Newsletter component should be present
    expect(html).toContain("newsletter");
  });

  test("skips posts with invalid or empty dates", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import(
      "./which-day-of-the-week-are-roast-dinners-better.astro"
    );
    const html = await container.renderToString(Page);

    // The post with empty date and 9.5 rating should not be counted.
    // Sunday has only 8.0 + 9.0 = 17, average 8.5. Not 8.83 (which it would be if 9.5 were counted).
    expect(html).toContain("8.50");
    expect(html).not.toContain("8.83");
  });
});
