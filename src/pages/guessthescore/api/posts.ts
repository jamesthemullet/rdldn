import type { APIRoute } from "astro";
import { getGamePosts } from "../../../lib/getGamePosts";

export type GamePost = {
  title: string;
  slug: string;
  imageUrl: string;
  rating: number;
};

// Fetching every post from WordPress takes several seconds, so let the CDN hold the list for
// a day and refresh it in the background after that. New weekly reviews show up within a day,
// and every deploy starts with an empty cache.
const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

export const GET: APIRoute = async () => {
  try {
    const posts = await getGamePosts();

    const gamePosts: GamePost[] = posts.flatMap((post) => {
      const ratingName = post.ratings?.nodes?.[0]?.name;
      const imageUrl = post.featuredImage?.node?.sourceUrl;
      if (!ratingName || !imageUrl) return [];
      const rating = Number.parseFloat(ratingName);
      if (Number.isNaN(rating) || rating < 0 || rating > 10) return [];
      return [{ title: post.title || "Unknown", slug: post.slug || "", imageUrl, rating }];
    });

    return new Response(JSON.stringify(gamePosts), {
      headers: { "Content-Type": "application/json", "Cache-Control": CACHE_CONTROL },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Could not load roast dinners" }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
};
