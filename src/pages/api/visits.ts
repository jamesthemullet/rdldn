import type { APIContext } from "astro";
import { and, eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { users, visits } from "../../lib/schema";

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return user?.id ?? null;
}

export async function GET(context: APIContext) {
  const { userId: clerkId } = context.locals.auth();

  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
  }

  const items = await db.select().from(visits).where(eq(visits.userId, userId)).orderBy(visits.visitedAt);

  return new Response(JSON.stringify(items), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(context: APIContext) {
  const { userId: clerkId } = context.locals.auth();

  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await context.request.json();
  const { postSlug, postTitle, postRating, notes } = body as {
    postSlug: string;
    postTitle: string;
    postRating?: string | null;
    notes?: string | null;
  };

  if (!postSlug || !postTitle) {
    return new Response(JSON.stringify({ error: "postSlug and postTitle are required" }), { status: 400 });
  }

  let userId = await getUserId(clerkId);
  if (!userId) {
    const [newUser] = await db.insert(users).values({ clerkId, email: "" }).returning({ id: users.id });
    userId = newUser.id;
  }

  const existing = await db
    .select({ id: visits.id })
    .from(visits)
    .where(and(eq(visits.userId, userId), eq(visits.postSlug, postSlug)))
    .limit(1);

  if (existing.length > 0) {
    return new Response(JSON.stringify({ visited: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  await db.insert(visits).values({
    userId,
    postSlug,
    postTitle,
    postRating: postRating ?? null,
    notes: notes ?? null,
  });

  return new Response(JSON.stringify({ visited: true }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
