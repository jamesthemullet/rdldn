import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";

vi.mock("../components/header/HeaderAuth");

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  )
}));

describe("privacy policy page", () => {
  test("renders", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./privacy-policy.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Privacy Policy");
    expect(html).toContain("Clerk");
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain("<h2>Privacy Policy</h2>");
  });
});
