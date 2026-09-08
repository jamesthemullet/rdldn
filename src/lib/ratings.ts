import { and, avg, count, eq, isNotNull } from "drizzle-orm";
import { db } from "./db";
import { visits } from "./schema";

const MIN_RATING = 0;
const MAX_RATING = 10;

export type PostRatingSummary = {
  average: number | null;
  count: number;
};

export function parseUserRating(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  if (value < MIN_RATING || value > MAX_RATING) return null;
  return Math.round(value * 100) / 100;
}

export async function getAverageRating(postSlug: string): Promise<PostRatingSummary> {
  const [row] = await db
    .select({ average: avg(visits.userRating), count: count(visits.userRating) })
    .from(visits)
    .where(and(eq(visits.postSlug, postSlug), isNotNull(visits.userRating)));

  const average = row?.average === null || row?.average === undefined ? null : Number.parseFloat(row.average);

  return {
    average: average !== null && !Number.isNaN(average) ? average : null,
    count: row?.count ?? 0,
  };
}
