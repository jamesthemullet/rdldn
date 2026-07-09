import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("explore-data-section component", () => {
  test("renders links for borough, meat, and a high rating", async () => {
    const container = await AstroContainer.create();
    const { default: ExploreDataSection } = await import("./explore-data-section.astro");
    const html = await container.renderToString(ExploreDataSection, {
      props: { borough: "Hackney", meat: "Beef", rating: "8.5" },
    });

    expect(html).toContain("Explore more:");
    expect(html).toContain('href="/league-of-roasts?borough=Hackney&amp;closedDown=open"');
    expect(html).toContain('href="/league-of-roasts?meat=Beef"');
    expect(html).toContain('href="/league-of-roasts?score=8"');
  });

  test("omits the rating link when rating is below 7", async () => {
    const container = await AstroContainer.create();
    const { default: ExploreDataSection } = await import("./explore-data-section.astro");
    const html = await container.renderToString(ExploreDataSection, {
      props: { borough: "Camden", meat: "Lamb", rating: "6.9" },
    });

    expect(html).toContain('href="/league-of-roasts?borough=Camden&amp;closedDown=open"');
    expect(html).toContain('href="/league-of-roasts?meat=Lamb"');
    expect(html).not.toContain("league-of-roasts?score=");
  });

  test("renders nothing when no borough, meat, or qualifying rating is provided", async () => {
    const container = await AstroContainer.create();
    const { default: ExploreDataSection } = await import("./explore-data-section.astro");
    const html = await container.renderToString(ExploreDataSection, {
      props: {},
    });

    expect(html).not.toContain("explore-data");
  });
});
