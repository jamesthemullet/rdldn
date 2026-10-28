// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  HAUNTED_TITLES,
  hasScrolledPast,
  isTypingTarget,
  pickHauntedTitle,
  pushSecretKey,
  wrapGravyWords,
} from "./halloweenEasterEggs";

function makeRoot(html: string): Element {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

function typeKeys(keys: string[]): boolean[] {
  let buffer = "";
  return keys.map((key) => {
    const result = pushSecretKey(buffer, key);
    buffer = result.buffer;
    return result.matched;
  });
}

describe("pickHauntedTitle", () => {
  it("picks a title from the list using the random source", () => {
    expect(pickHauntedTitle(() => 0)).toBe(HAUNTED_TITLES[0]);
    expect(pickHauntedTitle(() => 0.999)).toBe(HAUNTED_TITLES[HAUNTED_TITLES.length - 1]);
  });
});

describe("pushSecretKey", () => {
  it("matches when 'boo' is typed", () => {
    expect(typeKeys(["b", "o", "o"])).toEqual([false, false, true]);
  });

  it("matches 'gravy' case-insensitively after other keys", () => {
    expect(typeKeys(["x", "G", "r", "A", "v", "y"]).at(-1)).toBe(true);
  });

  it("ignores non-character keys like Shift", () => {
    expect(typeKeys(["b", "Shift", "o", "o"]).at(-1)).toBe(true);
  });

  it("resets after a match so it does not re-trigger immediately", () => {
    expect(typeKeys(["b", "o", "o", "o"])).toEqual([false, false, true, false]);
  });
});

describe("isTypingTarget", () => {
  it("treats form fields as typing targets", () => {
    expect(isTypingTarget(document.createElement("input"))).toBe(true);
    expect(isTypingTarget(document.createElement("textarea"))).toBe(true);
  });

  it("does not treat ordinary elements or null as typing targets", () => {
    expect(isTypingTarget(document.createElement("p"))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe("wrapGravyWords", () => {
  it("wraps each occurrence of gravy without changing the text", () => {
    const root = makeRoot("<p>The Gravy was thin, the gravy was cold.</p>");

    expect(wrapGravyWords(root)).toBe(2);
    expect(root.querySelectorAll(".haunted-gravy")).toHaveLength(2);
    expect(root.textContent).toBe("The Gravy was thin, the gravy was cold.");
  });

  it("respects the limit", () => {
    const root = makeRoot("<p>gravy gravy gravy</p>");

    expect(wrapGravyWords(root, 2)).toBe(2);
    expect(root.querySelectorAll(".haunted-gravy")).toHaveLength(2);
  });

  it("skips text inside scripts", () => {
    const root = makeRoot("<script>const gravy = 1;</script><p>no sauce here</p>");

    expect(wrapGravyWords(root)).toBe(0);
  });
});

describe("hasScrolledPast", () => {
  it("is true once the bottom of the viewport reaches the fraction", () => {
    expect(hasScrolledPast(0.8, 700, 100, 1000)).toBe(true);
    expect(hasScrolledPast(0.8, 600, 100, 1000)).toBe(false);
  });

  it("is false for an empty page", () => {
    expect(hasScrolledPast(0.8, 0, 0, 0)).toBe(false);
  });
});
