import type { Post } from "../types";

export type ValueScoredPost = {
  post: Post;
  rawPrice: number;
  adjustedPrice: number;
  rating: number;
  valueScore: number;
};

const parsePrice = (priceStr: string | undefined): number | null => {
  if (!priceStr) return null;
  const match = priceStr.match(/[\d,.]+/);
  if (!match) return null;
  const price = Number.parseFloat(match[0].replace(",", ""));
  return !Number.isNaN(price) && price > 0 ? price : null;
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
