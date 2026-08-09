import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("../components/header/HeaderAuth");

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  ),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("flags page", () => {
  test("renders the Feature Flags heading and flag labels from FLAG_DEFINITIONS", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./flags.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Feature Flags");
    expect(html).toContain("Mark As Visited");
    expect(html).toContain("Controls visibility of the mark as visited feature on review pages.");
  });

  test("renders visitTracking checkbox unchecked when no cookie is set", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./flags.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain('name="flag_visitTracking"');
    expect(html).not.toContain("checked");
  });

  test("renders visitTracking checkbox checked when flag_visitTracking cookie is true", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./flags.astro");
    const request = new Request("http://localhost:4321/flags", {
      headers: { Cookie: "flag_visitTracking=true" },
    });
    const html = await container.renderToString(Page, { request });

    expect(html).toContain('name="flag_visitTracking"');
    expect(html).toContain("checked");
  });
});
