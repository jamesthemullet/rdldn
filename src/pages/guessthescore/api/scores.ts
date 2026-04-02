import type { APIRoute } from "astro";
import { kv } from "../../../lib/kv";

export const GET: APIRoute = async () => {
  const results = await kv.zrange("leaderboard", 0, 9, { rev: true });

  const scores = (results as unknown[]).flatMap((member) => {
    if (typeof member === "object" && member !== null) return [member];
    if (typeof member === "string") {
      try {
        return [JSON.parse(member)];
      } catch {
        return [];
      }
    }
    return [];
  });

  return new Response(JSON.stringify(scores), {
    headers: { "Content-Type": "application/json" },
  });
};
