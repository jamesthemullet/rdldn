import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("newsletter component", () => {
  test("renders the Substack embed iframe", async () => {
    const container = await AstroContainer.create();
    const { default: Newsletter } = await import("./newsletter.astro");

    const html = await container.renderToString(Newsletter);

    expect(html).toContain('class="post-summary-block highlight-block substack-signup"');
    expect(html).toContain('src="https://rdldn.substack.com/embed"');
    expect(html).toContain('class="substack-signup-heading"');
    expect(html).toContain("Get new roast reviews direct to your inbox");
  });
});