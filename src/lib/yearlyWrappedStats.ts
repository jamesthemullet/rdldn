import type { Post } from "../types";
import type { Visit } from "./schema";

export type WrappedBestValueFind = {
  slug: string;
  title: string;
  rating: number;
  price: number;
  valueScore: number;
};

export type YearlyWrappedStats = {
  year: string;
  totalVisits: number;
  favouriteBorough: string | null;
  bestValueFind: WrappedBestValueFind | null;
};

const parseFirstNumericValue = (rawValue?: string | null): number | null => {
  if (!rawValue) return null;
  const match = rawValue.match(/[\d,.]+/);
  if (!match) return null;

  const parsedValue = Number.parseFloat(match[0].replace(/,/g, ""));
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const parsePriceValue = (rawValue?: string | null): number | null => {
  if (!rawValue) return null;
  const matches = rawValue.match(/[\d,.]+/g);
  if (!matches || matches.length === 0) return null;

  const parsedValues = matches
    .map((value) => Number.parseFloat(value.replace(/,/g, "")))
    .filter((value) => !Number.isNaN(value));

  if (parsedValues.length === 0) return null;

  const total = parsedValues.reduce((sum, value) => sum + value, 0);
  return total / parsedValues.length;
};

export function buildYearlyWrappedStats(visits: Visit[], posts: Post[], year: string): YearlyWrappedStats {
  const postsBySlug = new Map(posts.filter((post) => post.slug).map((post) => [post.slug as string, post]));

  const yearVisits = visits.filter((visit) => String(visit.visitedAt.getFullYear()) === year);

  const boroughCounts = new Map<string, number>();
  let bestValueFind: WrappedBestValueFind | null = null;

  yearVisits.forEach((visit) => {
    const post = postsBySlug.get(visit.postSlug);
    if (!post) return;

    const borough = post.boroughs?.nodes?.[0]?.name;
    const normalisedBorough = borough?.trim().toLowerCase();
    if (borough && normalisedBorough !== "n/a" && normalisedBorough !== "na" && normalisedBorough !== "none") {
      boroughCounts.set(borough, (boroughCounts.get(borough) ?? 0) + 1);
    }

    const rating = parseFirstNumericValue(post.ratings?.nodes?.[0]?.name);
    const price = parsePriceValue(post.prices?.nodes?.[0]?.name);
    if (rating === null || price === null || price <= 0) return;

    const valueScore = rating / price;
    if (!bestValueFind || valueScore > bestValueFind.valueScore) {
      bestValueFind = {
        slug: post.slug as string,
        title: post.title ?? post.slug ?? "",
        rating,
        price,
        valueScore,
      };
    }
  });

  const favouriteBorough =
    Array.from(boroughCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;

  return {
    year,
    totalVisits: yearVisits.length,
    favouriteBorough,
    bestValueFind,
  };
}
