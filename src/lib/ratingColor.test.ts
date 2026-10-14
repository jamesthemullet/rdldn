import { describe, expect, it } from "vitest";
import { getRatingColor } from "./ratingColor";

describe("getRatingColor", () => {
  it("returns the default colour for a non-finite rating", () => {
    expect(getRatingColor(Number.NaN)).toEqual({ color: "#fff", background: "#000000" });
  });

  it("returns the default colour for a rating below the lowest threshold", () => {
    expect(getRatingColor(2.9)).toEqual({ color: "#fff", background: "#000000" });
  });

  it.each([
    [9, { color: "#fff", background: "#4B0082" }],
    [8.5, { color: "#fff", background: "#83539B" }],
    [8, { color: "#fff", background: "#588EB5" }],
    [7.5, { color: "#000", background: "#51A790" }],
    [7, { color: "#000", background: "#4D7833" }],
    [6.5, { color: "#000", background: "#6A972A" }],
    [6, { color: "#000", background: "#CFB920" }],
    [5, { color: "#fff", background: "#CF7C1D" }],
    [4, { color: "#fff", background: "#FF0000" }],
    [3, { color: "#fff", background: "#8B0000" }],
  ])("returns the expected colour band for a rating of %s", (rating, expected) => {
    expect(getRatingColor(rating as number)).toEqual(expected);
  });
});
