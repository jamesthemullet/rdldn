import type { APIContext } from "astro";
import { getAverageRating, type PostRatingSummary } from "../../../lib/ratings";

export async function GET(context: APIContext): Promise<Response> {
  const { slug } = context.params;

  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), { status: 400 });
  }

  let summary: PostRatingSummary;
  try {
    summary = await getAverageRating(slug);
  } catch (error) {
    // The average is optional on the page, so a database failure should not surface as a 500.
    // Don't let the CDN cache the empty fallback.
    console.error("Failed to load rating summary", error);
    return new Response(JSON.stringify({ average: null, count: 0 } satisfies PostRatingSummary), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  return new Response(JSON.stringify(summary), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
