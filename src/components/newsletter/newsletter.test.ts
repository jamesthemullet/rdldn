import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("newsletter component", () => {
  test("renders signup link with gravy compliment", async () => {
    const container = await AstroContainer.create();
    const { default: Newsletter } = await import("./newsletter.astro");
    const html = await container.renderToString(Newsletter);

    expect(html).toContain("substack-signup");
    expect(html).toContain("rdldn.substack.com");
    expect(html).toContain("rich, glossy community of roast lovers");
  });
});
