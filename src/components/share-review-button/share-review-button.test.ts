import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("share-review-button component", () => {
  test("renders all four share links with correctly encoded URLs when all props are provided", async () => {
    const container = await AstroContainer.create();
    const { default: ShareReviewButton } = await import("./share-review-button.astro");

    const html = await container.renderToString(ShareReviewButton, {
      props: {
        title: "The Anchor",
        slug: "the-anchor",
        rating: "8.5",
        price: "£22",
        yearOfVisit: "2024",
        tubeStation: "Angel",
        loved: "Amazing Yorkshire pudding",
        loathed: "Too noisy",
      },
    });

    const expectedText = [
      "🍖 The Anchor",
      "Rating: 8.5/10",
      "Price: £22 (2024)",
      "Tube: Angel",
      "✅ Loved: Amazing Yorkshire pudding",
      "❌ Loathed: Too noisy",
      "rdldn.co.uk/the-anchor",
    ].join(" | ");

    expect(html).toContain(`https://wa.me/?text=${encodeURIComponent(expectedText)}`);
    expect(html).toContain(`https://www.threads.net/intent/post?text=${encodeURIComponent(expectedText)}`);
    expect(html).toContain(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://rdldn.co.uk/the-anchor")}`);
    expect(html).toContain(`https://bsky.app/intent/compose?text=${encodeURIComponent(expectedText)}`);
    expect(html).toContain("Share this review:");
    expect(html).toContain("Copy text");
  });

  test("renders share links with minimal text when only required props are given", async () => {
    const container = await AstroContainer.create();
    const { default: ShareReviewButton } = await import("./share-review-button.astro");

    const html = await container.renderToString(ShareReviewButton, {
      props: {
        title: "Simple Pub",
        slug: "simple-pub",
      },
    });

    const expectedText = "🍖 Simple Pub | rdldn.co.uk/simple-pub";

    expect(html).toContain(`https://wa.me/?text=${encodeURIComponent(expectedText)}`);
    expect(html).not.toContain("Rating:");
    expect(html).not.toContain("Price:");
    expect(html).not.toContain("Tube:");
    expect(html).not.toContain("Loved:");
    expect(html).not.toContain("Loathed:");
  });

  test("includes yearOfVisit inside the price string when both are provided, but omits it when only price is given", async () => {
    const container = await AstroContainer.create();
    const { default: ShareReviewButton } = await import("./share-review-button.astro");

    const htmlWithYear = await container.renderToString(ShareReviewButton, {
      props: { title: "Pub A", slug: "pub-a", price: "£20", yearOfVisit: "2023" },
    });
    expect(htmlWithYear).toContain(encodeURIComponent("Price: £20 (2023)"));

    const htmlWithoutYear = await container.renderToString(ShareReviewButton, {
      props: { title: "Pub B", slug: "pub-b", price: "£18" },
    });
    expect(htmlWithoutYear).toContain(encodeURIComponent("Price: £18"));
    expect(htmlWithoutYear).not.toContain(encodeURIComponent("Price: £18 ("));
  });
});
