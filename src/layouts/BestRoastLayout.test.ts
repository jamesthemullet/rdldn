import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

describe("BestRoastLayout", () => {
  test("renders rating and image alt fallback branches", async () => {
    const container = await AstroContainer.create();
    const { default: Layout } = await import("./BestRoastLayout.astro");

    const html = await container.renderToString(Layout, {
      props: {
        pageTitle: "Best Fallback Roasts",
        description: "Fallback test",
        opengraphImage: "https://example.com/og.jpg",
        content: "<p>Intro</p>",
        topRated: [
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
        ],
        highRated: [{ slug: "other-roast", name: "Other Roast", rating: 4.2 }],
        threadedComments: [],
        postId: "123"
      }
    });

    expect(html).toContain("Best Fallback Roasts");
    expect(html).toContain("Fallback Roast");
    expect(html).toMatch(/Rating:<\/strong>\s*NaN/);
    expect(html).toContain('alt="Image for Fallback Roast"');
  });
});
