// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { addBlueskyIframeTitles } from "./blueskyEmbedAccessibility";

function makeRoot(html: string): ParentNode {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

describe("addBlueskyIframeTitles", () => {
  it("gives an untitled Bluesky iframe an accessible title", () => {
    const root = makeRoot('<iframe data-bluesky-id="abc123"></iframe>');

    addBlueskyIframeTitles(root);

    expect(root.querySelector("iframe")?.getAttribute("title")).toBe("Embedded Bluesky post");
  });

  it("does not overwrite an iframe that already has a title", () => {
    const root = makeRoot('<iframe data-bluesky-id="abc123" title="Existing title"></iframe>');

    addBlueskyIframeTitles(root);

    expect(root.querySelector("iframe")?.getAttribute("title")).toBe("Existing title");
  });

  it("ignores iframes without a data-bluesky-id attribute", () => {
    const root = makeRoot('<iframe src="https://example.com"></iframe>');

    addBlueskyIframeTitles(root);

    expect(root.querySelector("iframe")?.hasAttribute("title")).toBe(false);
  });

  it("titles every untitled Bluesky iframe when there are multiple", () => {
    const root = makeRoot(
      '<iframe data-bluesky-id="one"></iframe><iframe data-bluesky-id="two"></iframe>'
    );

    addBlueskyIframeTitles(root);

    const titles = Array.from(root.querySelectorAll("iframe")).map((iframe) => iframe.getAttribute("title"));
    expect(titles).toEqual(["Embedded Bluesky post", "Embedded Bluesky post"]);
  });
});
