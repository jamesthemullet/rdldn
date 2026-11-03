import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("follow-card component", () => {
  test("renders a labelled link to each social profile", async () => {
    const container = await AstroContainer.create();
    const { default: FollowCard } = await import("./follow-card.astro");

    const html = await container.renderToString(FollowCard);

    expect(html).toContain("Enjoying this? Follow Lord Gravy");
    expect(html).toContain('href="https://instagram.com/roastdinnersinlondon"');
    expect(html).toContain('href="https://bsky.app/profile/roastdinners.bsky.social"');
    expect(html).toContain('href="https://www.threads.net/@roastdinnersinlondon"');
    expect(html).toContain('href="https://facebook.com/roastdinnerslondon"');
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(4);
  });
});
