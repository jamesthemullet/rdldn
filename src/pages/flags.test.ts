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

describe("flags page", () => {
  test("renders a toggle for each defined flag, unchecked when no cookie is set", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./flags.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/flags"),
    });

    expect(html).toContain("Feature Flags");
    expect(html).toContain("flag_visitTracking");
    expect(html).not.toMatch(/name="flag_visitTracking"[^>]*checked/);
  });

  test("renders the flag toggle as checked when its cookie is set to true", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./flags.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/flags", {
        headers: { Cookie: "flag_visitTracking=true" },
      }),
    });

    expect(html).toMatch(/name="flag_visitTracking"[^>]*checked/);
  });

  test("renders the flag toggle as unchecked when its cookie is set to false", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./flags.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/flags", {
        headers: { Cookie: "flag_visitTracking=false" },
      }),
    });

    expect(html).not.toMatch(/name="flag_visitTracking"[^>]*checked/);
  });

  test("renders the flag label and description from FLAG_DEFINITIONS", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./flags.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/flags"),
    });

    expect(html).toContain("Mark As Visited");
    expect(html).toContain("Controls visibility of the mark as visited feature on review pages.");
  });
});
