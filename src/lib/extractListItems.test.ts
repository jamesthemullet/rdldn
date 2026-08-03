import { describe, expect, test } from "vitest";
import { extractListItems } from "./extractListItems";

describe("extractListItems", () => {
  test("returns the text content of each list item", () => {
    const html = "<ul><li>The Approach Tavern</li><li>The Marksman</li></ul>";

    expect(extractListItems(html)).toEqual(["The Approach Tavern", "The Marksman"]);
  });

  test("strips nested tags such as links and formatting", () => {
    const html = '<ul><li><a href="/the-approach-tavern">The Approach Tavern</a> - Bethnal Green</li></ul>';

    expect(extractListItems(html)).toEqual(["The Approach Tavern - Bethnal Green"]);
  });

  test("decodes common HTML entities and collapses whitespace", () => {
    const html = "<li>Nell&#39;s   &amp;   Sons</li>";

    expect(extractListItems(html)).toEqual(["Nell's & Sons"]);
  });

  test("ignores empty list items", () => {
    const html = "<ul><li></li><li>  </li><li>The Marksman</li></ul>";

    expect(extractListItems(html)).toEqual(["The Marksman"]);
  });

  test("returns an empty array when there are no list items", () => {
    const html = "<p>No pubs listed yet.</p>";

    expect(extractListItems(html)).toEqual([]);
  });
});
