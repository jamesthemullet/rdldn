import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../components/header/HeaderAuth");

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  ),
}));

beforeEach(() => {
  vi.stubEnv("SCORE_SECRET", "test-secret");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("guessthescore page", () => {
  test("embeds the submit token and loads the roast list from the cached API", async () => {
    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    // Security token is embedded for score submission
    expect(html).toContain("__roastSubmitToken");

    // Posts are fetched in the browser rather than rendered into the page
    expect(html).toContain('fetch("/guessthescore/api/posts")');
    expect(html).not.toContain("__roastGamePosts");
  });
});
