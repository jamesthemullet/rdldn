import type { APIContext } from "astro";
import { getAllRoastDinnerPosts } from "../../../lib/getAllRoastDinnerPosts";
import { postForDate } from "../../../lib/postForDate";

export async function GET(_context: APIContext): Promise<Response> {
  const allPosts = await getAllRoastDinnerPosts();
  const validPosts = allPosts.filter((post) => {
    const ratingName = post.ratings?.nodes?.[0]?.name;
    const imageUrl = post.featuredImage?.node?.sourceUrl;
    if (!post.slug || !ratingName || !imageUrl) return false;
    const rating = Number.parseFloat(ratingName);
    return !Number.isNaN(rating) && rating >= 0 && rating <= 10;
  });

  const post = postForDate(new Date(), validPosts);

  if (!post) {
    return new Response(JSON.stringify({ error: "No posts available" }), { status: 404 });
  }

  return new Response(
    JSON.stringify({
      slug: post.slug,
      title: post.title || "Unknown",
      imageUrl: post.featuredImage?.node?.sourceUrl,
      rating: Number.parseFloat(post.ratings?.nodes?.[0]?.name ?? ""),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
