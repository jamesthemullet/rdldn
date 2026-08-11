import type { Post } from "../types";
import type { Visit } from "./schema";

export type PassportStats = {
  totalVisits: number;
  zonesVisited: number;
  favouriteMeat: string | null;
  topRatedVisit: { postSlug: string; postTitle: string; rating: number } | null;
};

export function computePassportStats(visits: Visit[], posts: Post[]): PassportStats {
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));
  const zones = new Set<string>();
  const meatCounts = new Map<string, number>();
  let topRatedVisit: PassportStats["topRatedVisit"] = null;

  for (const visit of visits) {
    const post = postsBySlug.get(visit.postSlug);
    post?.zones?.nodes.forEach((zone) => {
      zones.add(zone.name);
    });
    post?.meats?.nodes.forEach((meat) => {
      meatCounts.set(meat.name, (meatCounts.get(meat.name) ?? 0) + 1);
    });

    const rating = Number.parseFloat(visit.postRating ?? "");
    if (!Number.isNaN(rating) && (!topRatedVisit || rating > topRatedVisit.rating)) {
      topRatedVisit = { postSlug: visit.postSlug, postTitle: visit.postTitle, rating };
    }
  }

  let favouriteMeat: string | null = null;
  let favouriteMeatCount = 0;
  for (const [meat, count] of meatCounts) {
    if (count > favouriteMeatCount) {
      favouriteMeat = meat;
      favouriteMeatCount = count;
    }
  }

  return {
    totalVisits: visits.length,
    zonesVisited: zones.size,
    favouriteMeat,
    topRatedVisit,
  };
}
