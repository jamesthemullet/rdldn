import { expect, test, type Page } from "@playwright/test";

const SEARCH_ENDPOINT = "https://blog.rdldn.co.uk/graphql";

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

const mockSearchResponse = async (page: Page, options: MockOptions) => {
  await page.route(SEARCH_ENDPOINT, async (route) => {
    const payload = route.request().postDataJSON() as {
      variables?: { search?: string; first?: number };
    };

    if (options.expectedSearch) {
      expect(payload.variables?.search).toBe(options.expectedSearch);
    }

    if (typeof options.expectedLimit === "number") {
      expect(payload.variables?.first).toBe(options.expectedLimit);
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

    await page.getByPlaceholder("Search...").fill(searchTerm);
    await page.getByRole("button", { name: /search/i }).click();

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
    await page.getByPlaceholder("Search...").fill(searchTerm);
    await page.getByRole("button", { name: /search/i }).click();

    await expect(page.getByText("No results found.")).toBeVisible();
    await expect(page.locator("section.search-container li.heading")).toHaveCount(0);
  });
});
