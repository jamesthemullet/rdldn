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
  test("renders the flags page with no toggles when no flags are defined", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./flags.astro");
    const html = await container.renderToString(Page, {
      request: new Request("https://rdldn.co.uk/flags"),
    });

    expect(html).toContain("Feature Flags");
    expect(html).not.toContain("flag_item");
  });
});
