import { expect, test, type Page } from "@playwright/test";

const SEARCH_ENDPOINT = /https:\/\/blog\.rdldn\.co\.uk\/graphql\/?/;

type SearchNode = {
  title: string;
  slug: string;
  featuredImage?: { node?: { sourceUrl: string } };
};

type MockOptions = {
  nodes: SearchNode[];
  expectedSearch?: string;
  expectedLimit?: number;
};

const waitForAlpine = async (page: Page) => {
  await page.waitForFunction(() => {
    return typeof (window as typeof window & { Alpine?: unknown }).Alpine !== "undefined";
  });
};

const mockSearchResponse = async (page: Page, options: MockOptions) => {
  await page.route(SEARCH_ENDPOINT, async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    const variables = JSON.parse(
      new URL(request.url()).searchParams.get("variables") ?? "{}"
    ) as { search?: string; first?: number };

    if (options.expectedSearch) {
      expect(variables.search).toBe(options.expectedSearch);
    }

    if (typeof options.expectedLimit === "number") {
      expect(variables.first).toBe(options.expectedLimit);
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          posts: {
            nodes: options.nodes,
          },
        },
      }),
    });
  });
};

test.describe("search page", () => {
  test("renders results returned from the WordPress search API", async ({ page }) => {
    const searchTerm = "ketamine";
    const mockNodes: SearchNode[] = [
      {
        title: "Ketamine Sundays at The Roast",
        slug: "ketamine-sundays",
        featuredImage: { node: { sourceUrl: "https://images.example/ketamine.jpg" } },
      },
      {
        title: "Gravy and Ketamine Pairings",
        slug: "gravy-ketamine-pairings",
        featuredImage: { node: { sourceUrl: "https://images.example/pairings.jpg" } },
      },
    ];

    await mockSearchResponse(page, {
      nodes: mockNodes,
      expectedSearch: searchTerm,
      expectedLimit: 12,
    });

    await page.goto("/search");
    await expect(page.locator("section.search-page h2")).toHaveText("Search");
    await waitForAlpine(page);

    await page.getByPlaceholder("Search...").fill(searchTerm);

    const responsePromise = page.waitForResponse(SEARCH_ENDPOINT);
    await page.getByRole("button", { name: /search/i }).click();
    await responsePromise;

    const results = page.locator("section.search-container li.heading");
    await expect(results).toHaveCount(mockNodes.length);

    for (const node of mockNodes) {
      const item = page
        .locator("section.search-container li.heading")
        .filter({ hasText: node.title });
      await expect(item.getByRole("link", { name: node.title }).first()).toHaveAttribute(
        "href",
        `/${node.slug}`
      );
      await expect(
        item.locator("img")
      ).toHaveAttribute("src", node.featuredImage?.node?.sourceUrl ?? "");
    }
  });

  test("shows empty state when no matches are found", async ({ page }) => {
    const searchTerm = "nonexistentyaddagrrr";

    await mockSearchResponse(page, {
      nodes: [],
      expectedSearch: searchTerm,
      expectedLimit: 12,
    });

    await page.goto("/search");
    await waitForAlpine(page);

    await page.getByPlaceholder("Search...").fill(searchTerm);

    const responsePromise = page.waitForResponse(SEARCH_ENDPOINT);
    await page.getByRole("button", { name: /search/i }).click();
    await responsePromise;

    await expect(page.getByText("No results found.")).toBeVisible();
    await expect(page.locator("section.search-container li.heading")).toHaveCount(0);
  });

  test("shows an error message when the backend blocks the request", async ({ page }) => {
    // e.g. a Wordfence WAF block: a 403 HTML page instead of JSON
    await page.route(SEARCH_ENDPOINT, (route) =>
      route.fulfill({
        status: 403,
        contentType: "text/html",
        body: "<!DOCTYPE html><title>403 Forbidden</title>",
      })
    );

    await page.goto("/search");
    await waitForAlpine(page);

    await page.getByPlaceholder("Search...").fill("gravy");

    const responsePromise = page.waitForResponse(SEARCH_ENDPOINT);
    await page.getByRole("button", { name: /search/i }).click();
    await responsePromise;

    await expect(page.getByText("Search is unavailable right now.")).toBeVisible();
    await expect(page.getByText("No results found.")).toBeHidden();
  });
});
