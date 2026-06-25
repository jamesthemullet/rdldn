import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("search component", () => {
  test("renders default result limit and search UI", async () => {
    const container = await AstroContainer.create();
    const { default: Search } = await import("./search.astro");
    const html = await container.renderToString(Search);

    expect(html).toContain('x-data="searchComponent"');
    expect(html).toContain('data-result-limit="4"');
    expect(html).toContain('placeholder="Search..."');
    expect(html).toContain('x-show="searchResults.length &gt; 0"');
    expect(html).toContain("No results found.");
  });

  test("uses provided result limit and includes expected fetch contract", async () => {
    const container = await AstroContainer.create();
    const { default: Search } = await import("./search.astro");
    const html = await container.renderToString(Search, {
      props: { resultLimit: 9 }
    });

    expect(html).toContain('data-result-limit="9"');
    expect(html).toContain('fetch(GRAPHQL_URL');
    expect(html).toContain("query SearchPosts($search: String!, $first: Int!)");
    expect(html).toContain("search: this.searchTerm");
    expect(html).toContain("first: this.resultLimit");
    expect(html).toContain("this.searchPerformed = true");
    expect(html).toContain("ratings { nodes { name } }");
    expect(html).toContain("areas { nodes { name } }");
    expect(html).toContain("closedDowns { nodes { name } }");
  });

  test("renders score chip, area label, and closed badge elements", async () => {
    const container = await AstroContainer.create();
    const { default: Search } = await import("./search.astro");
    const html = await container.renderToString(Search);

    expect(html).toContain('class="score-chip"');
    expect(html).toContain('class="area-label"');
    expect(html).toContain('class="closed-badge"');
    expect(html).toContain("getScoreColor");
    expect(html).toContain("post.closedDowns?.nodes?.length &gt; 0");
  });
});
