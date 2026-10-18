import { describe, expect, it, vi } from "vitest";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("returns a new array containing the same items", () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle(items);
    expect(result).not.toBe(items);
    expect(result).toHaveLength(items.length);
    expect(result.sort()).toEqual([...items].sort());
  });

  it("does not mutate the input array", () => {
    const items = [1, 2, 3];
    const original = [...items];
    shuffle(items);
    expect(items).toEqual(original);
  });

  it("returns an empty array when given an empty array", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("returns a single-item array unchanged", () => {
    expect(shuffle([1])).toEqual([1]);
  });

  it("calls Math.random exactly once per index below the last, consistent with Fisher-Yates", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    shuffle([1, 2, 3, 4]);
    expect(randomSpy).toHaveBeenCalledTimes(3);
    randomSpy.mockRestore();
  });
});
