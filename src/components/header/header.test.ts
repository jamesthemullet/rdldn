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

describe("header component", () => {
  test("renders core navigation, dropdown and script behaviour", async () => {
    const container = await AstroContainer.create();
    const { default: Header } = await import("./header.astro");
    const html = await container.renderToString(Header);

    expect(html).toContain('aria-label="Home"');
    expect(html).toContain("Roast Dinners in London");
    expect(html).toContain('class="socials header-socials"');
    expect(html).toContain('id="nav-toggle"');

    expect(html).toContain('href="/league-of-roasts"');
    expect(html).toContain('href="/best-roast-lists"');
    expect(html).toContain('href="/maps"');
    expect(html).toContain('href="/to-do-list"');
    expect(html).toContain('href="/search"');
    expect(html).toContain('href="/archive"');
    expect(html).toContain('class="dropdown-toggle"');
    expect(html).toContain('href="/advertise-with-us"');

    expect(html).toContain("<script type=\"module\"");
    expect(html).toContain("header.astro?astro&type=script");
  });
});
