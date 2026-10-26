import { describe, expect, test } from "vitest";
import { haversineDistanceKm } from "./haversineDistance";

describe("haversineDistanceKm", () => {
  test("returns 0 for identical coordinates", () => {
    const point = { lat: 51.5074, lng: -0.1278 };

    expect(haversineDistanceKm(point, point)).toBe(0);
  });

  test("returns the known distance between two London landmarks", () => {
    // The Shard to Big Ben, roughly 2km apart.
    const theShard = { lat: 51.5045, lng: -0.0865 };
    const bigBen = { lat: 51.5007, lng: -0.1246 };

    expect(haversineDistanceKm(theShard, bigBen)).toBeCloseTo(2.7, 1);
  });

  test("returns the known distance between London and Manchester", () => {
    const london = { lat: 51.5074, lng: -0.1278 };
    const manchester = { lat: 53.4808, lng: -2.2426 };

    expect(haversineDistanceKm(london, manchester)).toBeCloseTo(262, 0);
  });

  test("is symmetric regardless of point order", () => {
    const a = { lat: 51.5074, lng: -0.1278 };
    const b = { lat: 53.4808, lng: -2.2426 };

    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a), 10);
  });
});
