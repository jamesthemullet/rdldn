import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("social-links component", () => {
  test("renders the default class name and all social profiles", async () => {
    const container = await AstroContainer.create();
    const { default: SocialLinks } = await import("./social-links.astro");

    const html = await container.renderToString(SocialLinks);

    expect(html).toContain('class="socials"');
    expect(html).toContain('href="https://www.threads.net/@roastdinnersinlondon"');
    expect(html).toContain('href="https://bsky.app/profile/roastdinners.bsky.social"');
    expect(html).toContain('href="https://facebook.com/roastdinnerslondon"');
    expect(html).toContain('href="https://instagram.com/roastdinnersinlondon"');
    expect(html).toContain('aria-label="Follow us on Threads"');
    expect(html).toContain('aria-label="Follow us on Bluesky"');
    expect(html).toContain('aria-label="Follow us on Facebook"');
    expect(html).toContain('aria-label="Follow us on Instagram"');
    expect(html).toContain('class="fab fa-facebook"');
  });

  test("allows the caller to override the wrapper class name", async () => {
    const container = await AstroContainer.create();
    const { default: SocialLinks } = await import("./social-links.astro");

    const html = await container.renderToString(SocialLinks, {
      props: {
        className: "socials header-socials"
      }
    });

    expect(html).toContain('class="socials header-socials"');
  });
});