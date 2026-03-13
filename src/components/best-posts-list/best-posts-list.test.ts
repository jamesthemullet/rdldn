import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("best-posts-list", () => {
  test("renders rating and image alt fallback branches", async () => {
    const container = await AstroContainer.create();
    const { default: BestPostsList } = await import("./best-posts-list.astro");

    const html = await container.renderToString(BestPostsList, {
      props: {
        posts: [
          {
            title: "Fallback Roast",
            slug: "fallback-roast",
            highlights: { loved: "Great crackling", loathed: "None" },
            ratings: { nodes: [{ name: "" }] },
            featuredImage: {
              node: {
                sourceUrl: "https://example.com/fallback.jpg"
              }
            },
            yearsOfVisit: { nodes: [{ name: "2025" }] }
          }
        ]
      }
    });

    expect(html).toContain("Fallback Roast");
    expect(html).toMatch(/Rating:<\/strong>\s*NaN/);
    expect(html).toContain('alt="Image for Fallback Roast"');
  });
});
