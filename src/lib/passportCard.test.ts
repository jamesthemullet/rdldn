import { describe, expect, it } from "vitest";
import { BADGES } from "./badges";
import { parsePassportCardParams } from "./passportCard";

function paramsFrom(entries: Record<string, string>): URLSearchParams {
  return new URLSearchParams(entries);
}

describe("parsePassportCardParams", () => {
  it("defaults to zeroed stats and no favourite meat when no params are given", () => {
    expect(parsePassportCardParams(paramsFrom({}))).toEqual({
      visits: 0,
      zones: 0,
      favouriteMeat: null,
      badgesEarned: 0,
      totalBadges: BADGES.length,
    });
  });

  it("parses valid numeric and text params", () => {
    const result = parsePassportCardParams(
      paramsFrom({ visits: "12", zones: "4", badges: "3", meat: "Beef" })
    );

    expect(result).toEqual({
      visits: 12,
      zones: 4,
      favouriteMeat: "Beef",
      badgesEarned: 3,
      totalBadges: BADGES.length,
    });
  });

  it("clamps negative or non-numeric counts to zero", () => {
    const result = parsePassportCardParams(paramsFrom({ visits: "-5", zones: "not-a-number" }));

    expect(result.visits).toBe(0);
    expect(result.zones).toBe(0);
  });

  it("clamps badgesEarned to the total number of badges", () => {
    const result = parsePassportCardParams(paramsFrom({ badges: "9999" }));

    expect(result.badgesEarned).toBe(BADGES.length);
  });

  it("trims and truncates an overly long meat value", () => {
    const longMeat = `  ${"a".repeat(50)}  `;
    const result = parsePassportCardParams(paramsFrom({ meat: longMeat }));

    expect(result.favouriteMeat).toBe("a".repeat(24));
  });

  it("treats a blank meat value as null", () => {
    const result = parsePassportCardParams(paramsFrom({ meat: "   " }));

    expect(result.favouriteMeat).toBeNull();
  });
});
