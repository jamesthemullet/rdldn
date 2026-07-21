import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { BADGES, computeEarnedBadges } from "../../../lib/badges";
import { db } from "../../../lib/db";
import { getAllRoastDinnerPosts } from "../../../lib/getAllRoastDinnerPosts";
import { users, visits } from "../../../lib/schema";

export async function GET(context: APIContext): Promise<Response> {
  const { userId: clerkId } = context.locals.auth();

  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) {
    return new Response(JSON.stringify({ badges: [], totalBadges: BADGES.length }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const userVisits = await db.select().from(visits).where(eq(visits.userId, user.id));
  const posts = await getAllRoastDinnerPosts();
  const badges = computeEarnedBadges(userVisits, posts);

  return new Response(JSON.stringify({ badges, totalBadges: BADGES.length }), {
    headers: { "Content-Type": "application/json" },
  });
}
