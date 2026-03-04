import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("astro:assets", () => ({
  Image: (() => {
    const ImageComponent = (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`;
    (ImageComponent as any).isAstroComponentFactory = true;
    return ImageComponent;
  })()
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("search page", () => {
  test("renders search intro copy and search component with expected limit", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-04T00:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: Page } = await import("./search.astro");
    const html = await container.renderToString(Page);

    expect(html).toMatch(/<h2[^>]*>Search<\/h2>/);
    expect(html).toContain("Looking for the best roast dinners in London?");
    expect(html).toContain("/best-roast-lists");
    expect(html).toContain('data-result-limit="12"');
    expect(html).toContain('placeholder="Search..."');
    expect(html).toContain("No results found.");
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners In London/);
  });
});
