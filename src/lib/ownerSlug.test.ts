import { describe, expect, it } from "vitest";
import { toOwnerSlug } from "./ownerSlug";

describe("toOwnerSlug", () => {
  it("lowercases the name", () => {
    expect(toOwnerSlug("John Smith")).toBe("john-smith");
  });

  it("replaces & with 'and'", () => {
    expect(toOwnerSlug("Tom & Jerry")).toBe("tom-and-jerry");
  });

  it("replaces spaces and punctuation with hyphens", () => {
    expect(toOwnerSlug("The Bull's Head")).toBe("the-bull-s-head");
  });

  it("collapses consecutive non-alphanumeric characters into a single hyphen", () => {
    expect(toOwnerSlug("The   Pub")).toBe("the-pub");
  });

  it("trims leading and trailing whitespace before slugifying", () => {
    expect(toOwnerSlug("  Pub  ")).toBe("pub");
  });

  it("strips leading and trailing hyphens produced by punctuation at the edges", () => {
    expect(toOwnerSlug("(The Pub)")).toBe("the-pub");
  });

  it("preserves digits in the output", () => {
    expect(toOwnerSlug("Pub 42")).toBe("pub-42");
  });

  it("returns a name that is already slug-friendly unchanged", () => {
    expect(toOwnerSlug("thepub")).toBe("thepub");
  });

  it("handles ampersand next to words without spaces", () => {
    expect(toOwnerSlug("Tom&Jerry")).toBe("tomandjerry");
  });

  it("returns an empty string for an empty input", () => {
    expect(toOwnerSlug("")).toBe("");
  });
});
