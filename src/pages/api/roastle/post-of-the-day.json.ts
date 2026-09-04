import type { APIRoute } from "astro";
import { getAllRoastDinnerPosts } from "../../../lib/getAllRoastDinnerPosts";
import { postForDate } from "../../../lib/postForDate";

export const GET: APIRoute = async () => {
  const posts = await getAllRoastDinnerPosts();
  const post = postForDate(new Date(), posts);

  if (!post) {
    return new Response(JSON.stringify({ error: "No eligible posts found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(post), {
    headers: { "Content-Type": "application/json" },
  });
};
