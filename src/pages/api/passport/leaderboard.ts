import type { APIRoute } from "astro";
import { getLeaderboardEntries } from "../../../lib/passportLeaderboard";

export const GET: APIRoute = async () => {
  const entries = await getLeaderboardEntries();

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json" },
  });
};
