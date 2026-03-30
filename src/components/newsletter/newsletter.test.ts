import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("newsletter component", () => {
  test("renders the Substack signup link with external link safeguards", async () => {
    const container = await AstroContainer.create();
    const { default: Newsletter } = await import("./newsletter.astro");

    const html = await container.renderToString(Newsletter);

    expect(html).toContain('class="post-summary-block highlight-block substack-signup"');
    expect(html).toContain('href="https://rdldn.substack.com/?r=601k45&utm_campaign=pub-share-checklist"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('class="substack-signup-link"');
    expect(html).toContain("Sign up to the newsletter!");
  });
});