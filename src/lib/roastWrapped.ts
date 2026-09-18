import { and, eq, gte, lt } from "drizzle-orm";
import type { Post } from "../types";
import { db } from "./db";
import type { Visit } from "./schema";
import { visits } from "./schema";
import { computeValueScores } from "./valueScore";

export type BoroughVisitCount = { borough: string; count: number };

export type BestValueFind = {
  slug: string;
  title: string;
  valueScore: number;
};

export type YearlyWrappedStats = {
  year: number;
  visitCount: number;
  boroughCounts: BoroughVisitCount[];
  favouriteBorough: string | null;
  bestValueFind: BestValueFind | null;
};

export async function getVisitsForYear(userId: string, year: number): Promise<Visit[]> {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  return db
    .select()
    .from(visits)
    .where(and(eq(visits.userId, userId), gte(visits.visitedAt, start), lt(visits.visitedAt, end)));
}

export function buildYearlyWrappedStats(
  year: number,
  yearVisits: Visit[],
  posts: Post[],
  inflationIndex: Record<string, number> = {}
): YearlyWrappedStats {
  const postsBySlug = new Map(posts.filter((post) => post.slug).map((post) => [post.slug as string, post]));

  const boroughCounts = new Map<string, number>();
  for (const visit of yearVisits) {
    const borough = postsBySlug.get(visit.postSlug)?.boroughs?.nodes[0]?.name;
    if (!borough) continue;
    boroughCounts.set(borough, (boroughCounts.get(borough) ?? 0) + 1);
  }

  const boroughCountsList = [...boroughCounts.entries()]
    .map(([borough, count]) => ({ borough, count }))
    .sort((a, b) => b.count - a.count);

  const visitedSlugs = new Set(yearVisits.map((visit) => visit.postSlug));
  const visitedPosts = posts.filter((post) => post.slug && visitedSlugs.has(post.slug));
  const bestValuePost = computeValueScores(visitedPosts, inflationIndex).sort(
    (a, b) => b.valueScore - a.valueScore
  )[0];

  return {
    year,
    visitCount: yearVisits.length,
    boroughCounts: boroughCountsList,
    favouriteBorough: boroughCountsList[0]?.borough ?? null,
    bestValueFind: bestValuePost
      ? {
          slug: bestValuePost.post.slug as string,
          title: bestValuePost.post.title ?? (bestValuePost.post.slug as string),
          valueScore: bestValuePost.valueScore,
        }
      : null,
  };
}
