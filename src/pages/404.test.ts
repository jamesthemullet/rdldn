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

describe("404 page", () => {
  test("renders the vegan gallery and return link", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T00:00:00.000Z"));

    const container = await AstroContainer.create();
    const { default: Page } = await import("./404.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("404 - Page Not Found");
    expect(html).toContain("Welcome to Vegan Roast Dinners in London");
    expect(html).toContain("Oops! Looks like you've wandered into our secret vegan section");
    expect(html).toContain("🥩 Return to Safety (Real Roast Dinners) 🥩");

    expect(html).toContain("Vegan Roast Dinner 1");
    expect(html).toContain("Vegan Roast Dinner 2");
    expect(html).toContain("Vegan Roast Dinner 3");
    expect(html).toContain("Vegan Roast Dinner 4");
    expect(html).toContain("Vegan Roast Dinner 5");
    expect(html).toContain("Vegan Roast Dinner 6");
  });
});