import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
});

describe("footer component", () => {
  test("renders footer social links, search link and current year", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: Footer } = await import("./footer.astro");
    const html = await container.renderToString(Footer);

    expect(html).toContain('class="socials footer-socials"');
    expect(html).toContain('href="/search"');
    expect(html).toContain("Search This Gravy Glory Hole");
    expect(html).toContain('class="fas fa-search"');
    expect(html).toMatch(/(&copy;|©)\s*2026 Roast Dinners In London/);
  });
});
