import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

const render = async (listLength: number) => {
  const container = await AstroContainer.create();
  const { default: BestOfBottom } = await import("./best-of-bottom.astro");

  return container.renderToString(BestOfBottom, {
    props: { listLength, threadedComments: [], postId: "1" },
    request: new Request("https://rdldn.co.uk/best-roast-lamb-in-london")
  });
};

describe("best-of-bottom component", () => {
  test("links to the other ingredient pages but not the current one", async () => {
    const html = await render(10);

    expect(html).toContain('href="/best-gravy-in-london"');
    expect(html).toContain('href="/best-roast-beef-in-london"');
    expect(html).not.toContain('href="/best-roast-lamb-in-london"');
    expect(html).toContain("Find your next roast:");
    expect(html).toContain("Leave a comment");
  });

  test("skips prompts already shown mid-list on a full list", async () => {
    const html = await render(10);

    expect(html).not.toContain("substack-signup");
    expect(html).not.toContain("Follow Lord Gravy");
  });

  test("shows prompts at the bottom when the list is too short for them", async () => {
    const shortList = await render(2);
    expect(shortList).toContain("substack-signup--panel");
    expect(shortList).toContain("Follow Lord Gravy");

    const midList = await render(6);
    expect(midList).not.toContain("substack-signup");
    expect(midList).toContain("Follow Lord Gravy");
  });
});
