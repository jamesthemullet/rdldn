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

  test("falls back to splitting <br>-separated lines within a paragraph", () => {
    const html =
      '<p class="wp-block-paragraph">Some intro text.</p>' +
      '<p class="wp-block-paragraph"><br />Prospect Of Whitby – Wapping<br />The Ned, Bank<br />' +
      "Rules, The Strand (Monday to Sunday)</p>";

    expect(extractListItems(html)).toEqual([
      "Prospect Of Whitby – Wapping",
      "The Ned, Bank",
      "Rules, The Strand (Monday to Sunday)"
    ]);
  });

  test("ignores plain paragraphs with no <br> line breaks", () => {
    const html =
      '<p class="wp-block-paragraph">Everyone needs a to-do list.</p>' +
      '<p class="wp-block-paragraph">Now also featuring recommender.</p>';

    expect(extractListItems(html)).toEqual([]);
  });

  test("ignores a paragraph with too few <br>-separated lines to be a list", () => {
    const html = '<p class="wp-block-paragraph">First line<br />Second line</p>';

    expect(extractListItems(html)).toEqual([]);
  });

  test("prefers <li> items over <br>-separated paragraphs when both exist", () => {
    const html =
      "<ul><li>The Marksman</li></ul>" +
      '<p class="wp-block-paragraph">A<br />B<br />C</p>';

    expect(extractListItems(html)).toEqual(["The Marksman"]);
  });
});
