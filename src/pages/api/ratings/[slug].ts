import type { APIContext } from "astro";
import { getAverageRating } from "../../../lib/ratings";

export async function GET(context: APIContext): Promise<Response> {
  const { slug } = context.params;

  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), { status: 400 });
  }

  const summary = await getAverageRating(slug);

  return new Response(JSON.stringify(summary), {
    headers: { "Content-Type": "application/json" },
  });
}
