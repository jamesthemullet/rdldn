import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getAllRoastDinnerPosts } from "../../lib/getAllRoastDinnerPosts";
import type { Post } from "../../types";

vi.mock("../../lib/getAllRoastDinnerPosts", () => ({
  getAllRoastDinnerPosts: vi.fn(),
}));

vi.mock("astro:assets", () => ({
  Image: Object.assign(
    (_result: unknown, props: { src: string; alt?: string }) =>
      `<img src="${props.src}" alt="${props.alt ?? ""}" />`,
    { isAstroComponentFactory: true }
  ),
}));

beforeEach(() => {
  vi.resetModules();
  vi.mocked(getAllRoastDinnerPosts).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("chains index page", () => {
  test("renders dropdown options for chains with at least two reviews", async () => {
    vi.mocked(getAllRoastDinnerPosts).mockResolvedValue([
      {
        slug: "alpha-1",
        date: "",
        owners: { nodes: [{ name: "Alpha & Co" }] },
      },
      {
        slug: "alpha-2",
        date: "",
        owners: { nodes: [{ name: "Alpha & Co" }, { name: "Independent" }] },
      },
      {
        slug: "beta-1",
        date: "",
        owners: { nodes: [{ name: "Beta Group" }] },
      },
      {
        slug: "zeta-1",
        date: "",
        owners: { nodes: [{ name: "Zeta Chain" }] },
      },
      {
        slug: "zeta-2",
        date: "",
        owners: { nodes: [{ name: "Zeta Chain" }] },
      },
    ] as Post[]);

    const container = await AstroContainer.create();
    const { default: Page } = await import("./index.astro");
    const html = await container.renderToString(Page);

    expect(html).toContain("Chains</h2>");
    expect(html).toContain("Select Chain:");
    expect(html).toContain('id="chain-select"');
    expect(html).toContain('onchange="if (this.value) window.location.href = `/chains/${this.value}`"');
    expect(html).toContain('value="alpha-and-co"');
    expect(html).toContain('value="zeta-chain"');
    expect(html).not.toContain('value="beta-group"');
    expect(html).not.toContain('value="independent"');

    const alphaIndex = html.indexOf("Alpha &amp; Co");
    const zetaIndex = html.indexOf("Zeta Chain");
    expect(alphaIndex).toBeGreaterThan(-1);
    expect(zetaIndex).toBeGreaterThan(-1);
    expect(alphaIndex).toBeLessThan(zetaIndex);
  });
});
