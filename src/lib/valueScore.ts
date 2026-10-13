import type { Post } from "../types";
import { parsePrice } from "./parsePrice";

export type ValueScoredPost = {
  post: Post;
  rawPrice: number;
  adjustedPrice: number;
  rating: number;
  valueScore: number;
};

export function computeValueScores(
  posts: Post[],
  inflationIndex: Record<string, number>
): ValueScoredPost[] {
  const scored: ValueScoredPost[] = [];

  for (const post of posts) {
    const rating = Number.parseFloat(post.ratings?.nodes[0]?.name ?? "");
    const rawPrice = parsePrice(post.prices?.nodes[0]?.name);
    if (!rawPrice || Number.isNaN(rating) || rating <= 0) continue;

    const year = post.yearsOfVisit?.nodes[0]?.name;
    const multiplier = year ? inflationIndex[year] : undefined;
    const adjustedPrice = multiplier ? rawPrice * multiplier : rawPrice;

    scored.push({
      post,
      rawPrice,
      adjustedPrice,
      rating,
      valueScore: rating / adjustedPrice,
    });
  }

  return scored;
}
