import type { Post } from "../types";

export type DailyPost = {
  title: string;
  slug: string;
  imageUrl: string;
  rating: number;
};

function hashStringToInt(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toEligiblePosts(posts: Post[]): DailyPost[] {
  return posts
    .filter((post) => {
      const ratingName = post.ratings?.nodes?.[0]?.name;
      const imageUrl = post.featuredImage?.node?.sourceUrl;
      if (!ratingName || !imageUrl || !post.slug) return false;
      const rating = Number.parseFloat(ratingName);
      return !Number.isNaN(rating) && rating >= 0 && rating <= 10;
    })
    .map((post) => ({
      title: post.title || "Unknown",
      slug: post.slug as string,
      imageUrl: post.featuredImage?.node.sourceUrl as string,
      rating: Number.parseFloat(post.ratings?.nodes[0]?.name as string),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Deterministically picks a "post of the day" for the given date: the same
 * date and candidate pool always resolve to the same post, so every player
 * sees the same daily puzzle.
 */
export function postForDate(date: Date, posts: Post[]): DailyPost | null {
  const eligible = toEligiblePosts(posts);
  if (eligible.length === 0) return null;

  const index = hashStringToInt(toDateKey(date)) % eligible.length;
  return eligible[index];
}
