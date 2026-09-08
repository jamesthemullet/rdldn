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
    expect(html).toContain("flag_myPassport");
    expect(html).not.toMatch(/name="flag_myPassport"[^>]*checked/);
  });

  test("renders the flag toggle as checked when its cookie is set to true", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./flags.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/flags", {
        headers: { Cookie: "flag_myPassport=true" },
      }),
    });

    expect(html).toMatch(/name="flag_myPassport"[^>]*checked/);
  });

  test("renders the flag toggle as unchecked when its cookie is set to false", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./flags.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/flags", {
        headers: { Cookie: "flag_myPassport=false" },
      }),
    });

    expect(html).not.toMatch(/name="flag_myPassport"[^>]*checked/);
  });

  test("renders the flag label and description from FLAG_DEFINITIONS", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./flags.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/flags"),
    });

    expect(html).toContain("My Passport");
    expect(html).toContain("Controls access to the My Roast Dinner Passport page.");
  });
});
