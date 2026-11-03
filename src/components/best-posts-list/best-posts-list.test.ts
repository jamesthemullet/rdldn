import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) => ({
      render(destination: { write: (chunk: string) => void }) {
        destination.write(`<img src="${props.src}" alt="${props.alt ?? ""}" />`);
      },
    }),
    { isAstroComponentFactory: true }
  ),
}));

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

  test("numbers entries and places signup prompts mid-list", async () => {
    const container = await AstroContainer.create();
    const { default: BestPostsList } = await import("./best-posts-list.astro");

    const posts = Array.from({ length: 10 }, (_, i) => ({
      title: `Roast ${i + 1}`,
      slug: `roast-${i + 1}`,
      ratings: { nodes: [{ name: String(9.5 - i / 10) }] }
    }));

    const html = await container.renderToString(BestPostsList, { props: { posts } });

    expect(html).toMatch(/1\. <a href="\/roast-1">Roast 1<\/a>/);
    expect(html).toMatch(/10\. <a href="\/roast-10">Roast 10<\/a>/);

    const newsletterAt = html.indexOf("substack-signup--panel");
    const followAt = html.indexOf("Enjoying this? Follow Lord Gravy");
    expect(newsletterAt).toBeGreaterThan(html.indexOf("Roast 4<"));
    expect(newsletterAt).toBeLessThan(html.indexOf("Roast 5<"));
    expect(followAt).toBeGreaterThan(html.indexOf("Roast 7<"));
    expect(followAt).toBeLessThan(html.indexOf("Roast 8<"));
  });

  test("leaves prompts for the bottom on very short lists", async () => {
    const container = await AstroContainer.create();
    const { default: BestPostsList } = await import("./best-posts-list.astro");

    const html = await container.renderToString(BestPostsList, {
      props: { posts: [{ title: "Only Roast", slug: "only-roast", ratings: { nodes: [{ name: "9" }] } }] }
    });

    expect(html).not.toContain("substack-signup");
    expect(html).not.toContain("Follow Lord Gravy");
  });
});
