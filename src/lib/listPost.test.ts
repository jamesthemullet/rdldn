import { describe, expect, test } from "vitest";
import { rewriteInternalLinks, splitBeforeNumberedHeadings } from "./listPost";

const listHtml = (count: number) =>
  "<p>Intro</p>" +
  Array.from({ length: count }, (_, i) => `<h2 class="wp-block-heading">${count - i}. Pub ${count - i}</h2><p>Body</p>`).join("");

describe("rewriteInternalLinks", () => {
  test("points links to our own posts at the site root", () => {
    const html =
      '<a href="https://blog.rdldn.co.uk/the-railway-teddington/">a</a>' +
      '<a href="https://rdldn.co.uk/league-of-roasts/">b</a>' +
      '<a href="https://www.rdldn.co.uk/awards/#:~:text=x">c</a>';

    expect(rewriteInternalLinks(html)).toBe(
      '<a href="/the-railway-teddington/">a</a><a href="/league-of-roasts/">b</a><a href="/awards/#:~:text=x">c</a>'
    );
  });

  test("leaves uploaded media and external links alone", () => {
    const html =
      '<a href="https://blog.rdldn.co.uk/wp-content/uploads/a.jpg">a</a><a href="https://example.com/rdldn.co.uk/">b</a>';

    expect(rewriteInternalLinks(html)).toBe(html);
  });
});

describe("splitBeforeNumberedHeadings", () => {
  test("splits before the requested list entries", () => {
    const segments = splitBeforeNumberedHeadings(listHtml(10), [5, 8]);

    expect(segments).toHaveLength(3);
    expect(segments?.join("")).toBe(listHtml(10));
    expect(segments?.[0]).toContain("7. Pub 7");
    expect(segments?.[1]?.startsWith('<h2 class="wp-block-heading">6. Pub 6')).toBe(true);
    expect(segments?.[2]?.startsWith('<h2 class="wp-block-heading">3. Pub 3')).toBe(true);
  });

  test("returns null when the post has too few numbered entries", () => {
    expect(splitBeforeNumberedHeadings(listHtml(7), [5, 8])).toBeNull();
    expect(splitBeforeNumberedHeadings("<h2>Not a list</h2><p>Body</p>", [1])).toBeNull();
  });
});
