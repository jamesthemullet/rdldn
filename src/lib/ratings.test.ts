import { describe, expect, test, vi } from "vitest";

vi.mock("./db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "./db";
import { getAverageRating, parseUserRating } from "./ratings";

function makeSelectChain(result: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(result),
  };
}

describe("parseUserRating", () => {
  test("accepts numbers within range", () => {
    expect(parseUserRating(0)).toBe(0);
    expect(parseUserRating(7.5)).toBe(7.5);
    expect(parseUserRating(10)).toBe(10);
  });

  test("rounds to two decimal places", () => {
    expect(parseUserRating(7.23456)).toBe(7.23);
    expect(parseUserRating(9.999)).toBe(10);
  });

  test("rejects out-of-range or non-numeric values", () => {
    expect(parseUserRating(-1)).toBeNull();
    expect(parseUserRating(11)).toBeNull();
    expect(parseUserRating("8")).toBeNull();
    expect(parseUserRating(null)).toBeNull();
    expect(parseUserRating(undefined)).toBeNull();
    expect(parseUserRating(Number.NaN)).toBeNull();
  });
});

describe("getAverageRating", () => {
  test("returns null average and 0 count when there are no ratings", async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectChain([{ average: null, count: 0 }]) as never);
    const result = await getAverageRating("some-slug");
    expect(result).toEqual({ average: null, count: 0 });
  });

  test("returns the parsed average and count", async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectChain([{ average: "7.5", count: 4 }]) as never);
    const result = await getAverageRating("some-slug");
    expect(result).toEqual({ average: 7.5, count: 4 });
  });
});
