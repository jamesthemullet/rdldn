import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { computeEarnedBadges } from "../../../../lib/badges";
import { db } from "../../../../lib/db";
import { getAllRoastDinnerPosts } from "../../../../lib/getAllRoastDinnerPosts";
import {
  removeLeaderboardEntry,
  sanitizeDisplayName,
  setLeaderboardEntry,
} from "../../../../lib/passportLeaderboard";
import { users, visits as visitsTable } from "../../../../lib/schema";

type OptInBody = {
  optIn?: unknown;
  displayName?: unknown;
};

export async function POST(context: APIContext): Promise<Response> {
  const { userId: clerkId } = context.locals.auth();

  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: OptInBody;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  const { optIn, displayName } = body;
  if (typeof optIn !== "boolean") {
    return new Response(JSON.stringify({ error: "optIn must be a boolean" }), { status: 400 });
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  if (!optIn) {
    await db.update(users).set({ leaderboardOptIn: false }).where(eq(users.id, user.id));
    await removeLeaderboardEntry(user.id);

    return new Response(JSON.stringify({ optedIn: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const sanitizedName = sanitizeDisplayName(displayName);
  if (!sanitizedName) {
    return new Response(JSON.stringify({ error: "A display name is required to join the leaderboard" }), {
      status: 400,
    });
  }

  await db
    .update(users)
    .set({ leaderboardOptIn: true, leaderboardDisplayName: sanitizedName })
    .where(eq(users.id, user.id));

  const userVisits = await db.select().from(visitsTable).where(eq(visitsTable.userId, user.id));
  const posts = await getAllRoastDinnerPosts();
  const earnedBadges = computeEarnedBadges(userVisits, posts);

  await setLeaderboardEntry(user.id, {
    displayName: sanitizedName,
    visits: userVisits.length,
    badges: earnedBadges.length,
  });

  return new Response(JSON.stringify({ optedIn: true, displayName: sanitizedName }), {
    headers: { "Content-Type": "application/json" },
  });
}
