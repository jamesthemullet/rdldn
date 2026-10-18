import { describe, expect, test } from "vitest";
import { isNonEmptyString, isOptionalNullableString } from "./validation";

describe("isNonEmptyString", () => {
  test("returns true for a non-empty string", () => {
    expect(isNonEmptyString("roast")).toBe(true);
  });

  test("returns false for an empty string", () => {
    expect(isNonEmptyString("")).toBe(false);
  });

  test.each([123, null, undefined, {}, []])("returns false for %p", (value) => {
    expect(isNonEmptyString(value)).toBe(false);
  });
});

describe("isOptionalNullableString", () => {
  test.each(["9.0", null, undefined])("returns true for %p", (value) => {
    expect(isOptionalNullableString(value)).toBe(true);
  });

  test.each([123, {}, []])("returns false for %p", (value) => {
    expect(isOptionalNullableString(value)).toBe(false);
  });
});
