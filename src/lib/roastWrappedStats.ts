import type { Post } from "../types";
import type { Visit } from "./schema";
import { computeValueScores } from "./valueScore";

export type RoastWrappedStats = {
  year: number;
  visitCount: number;
  boroughsVisited: number;
  bestValueFind: { postSlug: string; postTitle: string; valueScore: number } | null;
};

export function computeRoastWrappedStats(
  visits: Visit[],
  posts: Post[],
  year: number,
  inflationIndex: Record<string, number> = {}
): RoastWrappedStats {
  const yearVisits = visits.filter((visit) => visit.visitedAt.getFullYear() === year);
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));

  const boroughs = new Set<string>();
  const visitedPosts: Post[] = [];
  for (const visit of yearVisits) {
    const post = postsBySlug.get(visit.postSlug);
    if (post) {
      visitedPosts.push(post);
    }
    post?.boroughs?.nodes.forEach((borough) => {
      boroughs.add(borough.name);
    });
  }

  let bestValueFind: RoastWrappedStats["bestValueFind"] = null;
  for (const scored of computeValueScores(visitedPosts, inflationIndex)) {
    if (!bestValueFind || scored.valueScore > bestValueFind.valueScore) {
      bestValueFind = {
        postSlug: scored.post.slug ?? "",
        postTitle: scored.post.title ?? "",
        valueScore: scored.valueScore,
      };
    }
  }

  return {
    year,
    visitCount: yearVisits.length,
    boroughsVisited: boroughs.size,
    bestValueFind,
  };
}
