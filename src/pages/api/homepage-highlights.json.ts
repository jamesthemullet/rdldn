import type { APIRoute } from "astro";
import { getHomepageHighlights } from "../../lib/homepage-highlights";

export const GET: APIRoute = async () => {
  const data = await getHomepageHighlights();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
};
