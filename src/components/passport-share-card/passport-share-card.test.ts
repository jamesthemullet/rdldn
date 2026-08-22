import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("passport-share-card component", () => {
  test("renders a preview image and all share links with the og image url and stats encoded", async () => {
    const container = await AstroContainer.create();
    const { default: PassportShareCard } = await import("./passport-share-card.astro");

    const html = await container.renderToString(PassportShareCard, {
      props: {
        visits: 12,
        zones: 4,
        favouriteMeat: "Beef",
        badgesEarned: 3,
        totalBadges: 9,
      },
    });

    const expectedOgUrl =
      "https://rdldn.co.uk/api/passport/og?visits=12&zones=4&badges=3&meat=Beef";
    const expectedText = [
      "🍖 My Roast Dinner Passport",
      "12 restaurants visited",
      "3/9 badges earned",
      "Favourite meat: Beef",
      expectedOgUrl,
    ].join(" | ");

    expect(html).toContain(expectedOgUrl.replaceAll("&", "&amp;"));
    expect(html).toContain(`https://wa.me/?text=${encodeURIComponent(expectedText)}`);
    expect(html).toContain(`https://www.threads.net/intent/post?text=${encodeURIComponent(expectedText)}`);
    expect(html).toContain(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(expectedOgUrl)}`
    );
    expect(html).toContain(`https://bsky.app/intent/compose?text=${encodeURIComponent(expectedText)}`);
    expect(html).toContain("Share your passport:");
    expect(html).toContain("Copy image link");
  });

  test("omits the meat query param and singularises 'restaurant' for a single visit with no favourite meat", async () => {
    const container = await AstroContainer.create();
    const { default: PassportShareCard } = await import("./passport-share-card.astro");

    const html = await container.renderToString(PassportShareCard, {
      props: {
        visits: 1,
        zones: 1,
        favouriteMeat: null,
        badgesEarned: 1,
        totalBadges: 9,
      },
    });

    const expectedOgUrl = "https://rdldn.co.uk/api/passport/og?visits=1&zones=1&badges=1";

    expect(html).toContain(expectedOgUrl.replaceAll("&", "&amp;"));
    expect(html).not.toContain("meat=");
    expect(html).toContain(encodeURIComponent("1 restaurant visited"));
    expect(html).not.toContain(encodeURIComponent("1 restaurants visited"));
  });
});
