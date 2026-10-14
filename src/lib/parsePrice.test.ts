import { describe, expect, it } from "vitest";
import { parsePrice } from "./parsePrice";

describe("parsePrice", () => {
  it("returns null for undefined input", () => {
    expect(parsePrice(undefined)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parsePrice("")).toBeNull();
  });

  it("strips the currency symbol and parses a float", () => {
    expect(parsePrice("£18.50")).toBe(18.5);
  });

  it("handles thousands separators", () => {
    expect(parsePrice("£1,200")).toBe(1200);
  });

  it("returns null when there are no digits", () => {
    expect(parsePrice("N/A")).toBeNull();
  });

  it("returns null for a zero price", () => {
    expect(parsePrice("£0")).toBeNull();
  });

  it("ignores non-digit characters surrounding the number", () => {
    expect(parsePrice("-£10")).toBe(10);
  });
});
