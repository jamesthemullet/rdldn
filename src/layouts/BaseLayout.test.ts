import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

vi.mock("../components/header/HeaderAuth");

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  ),
}));

describe("BaseLayout", () => {
  test("renders the HTML shell with the page title, charset, and skip-nav link", async () => {
    const container = await AstroContainer.create();
    const { default: Layout } = await import("./BaseLayout.astro");

    const html = await container.renderToString(Layout, {
      props: {
        pageTitle: "My Test Page",
        description: "A short test description",
      },
      request: new Request("https://rdldn.co.uk/my-test-page"),
    });

    expect(html).toContain("My Test Page");
    expect(html).toContain("A short test description");
    expect(html).toContain('charset="utf-8"');
    expect(html).toContain('href="#main-content"');
  });

  test("inlines structured data as an application/ld+json script when provided", async () => {
    const container = await AstroContainer.create();
    const { default: Layout } = await import("./BaseLayout.astro");

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: "The Best Pub",
    };

    const html = await container.renderToString(Layout, {
      props: {
        pageTitle: "The Best Pub",
        structuredData,
      },
    });

    expect(html).toContain("application/ld+json");
    expect(html).toContain('"@type":"Restaurant"');
    expect(html).toContain('"name":"The Best Pub"');
  });
});
