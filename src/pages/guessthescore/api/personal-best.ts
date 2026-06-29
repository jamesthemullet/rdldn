import type { APIContext } from "astro";
import { and, eq } from "drizzle-orm";
import { db } from "../../../lib/db";
import { gamePersonalBests, users } from "../../../lib/schema";

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return user?.id ?? null;
}

export async function GET(context: APIContext): Promise<Response> {
  const { userId: clerkId } = context.locals.auth();

  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return new Response(JSON.stringify({ score: null }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const [row] = await db
    .select({ score: gamePersonalBests.score })
    .from(gamePersonalBests)
    .where(and(eq(gamePersonalBests.userId, userId), eq(gamePersonalBests.game, "guessthescore")))
    .limit(1);

  return new Response(JSON.stringify({ score: row?.score ?? null }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(context: APIContext): Promise<Response> {
  const { userId: clerkId } = context.locals.auth();

  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await context.request.json() as { score: unknown };
  const { score } = body;

  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > 100) {
    return new Response(JSON.stringify({ error: "Invalid score" }), { status: 400 });
  }

  let userId = await getUserId(clerkId);
  if (!userId) {
    const [newUser] = await db.insert(users).values({ clerkId, email: "" }).returning({ id: users.id });
    userId = newUser.id;
  }

  const [existing] = await db
    .select({ id: gamePersonalBests.id, score: gamePersonalBests.score })
    .from(gamePersonalBests)
    .where(and(eq(gamePersonalBests.userId, userId), eq(gamePersonalBests.game, "guessthescore")))
    .limit(1);

  if (existing) {
    if (score <= existing.score) {
      return new Response(JSON.stringify({ saved: false, personalBest: existing.score }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    await db
      .update(gamePersonalBests)
      .set({ score, updatedAt: new Date() })
      .where(eq(gamePersonalBests.id, existing.id));
  } else {
    await db.insert(gamePersonalBests).values({ userId, game: "guessthescore", score });
  }

  return new Response(JSON.stringify({ saved: true, personalBest: score }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
