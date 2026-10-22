import type { Post } from "../types";

function dayNumber(date: Date): number {
  const isoDate = date.toISOString().slice(0, 10);
  return Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000);
}

// Picks one post per UTC calendar day so every visitor gets the same daily post.
export function postForDate(date: Date, posts: Post[]): Post | null {
  if (posts.length === 0) return null;

  const sortedPosts = [...posts].sort((a, b) => (a.slug ?? "").localeCompare(b.slug ?? ""));
  const index = ((dayNumber(date) % sortedPosts.length) + sortedPosts.length) % sortedPosts.length;

  return sortedPosts[index];
}
