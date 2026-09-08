import type { APIContext } from "astro";
import { and, eq } from "drizzle-orm";
import { db } from "../../../lib/db";
import { parseUserRating } from "../../../lib/ratings";
import { users, visits } from "../../../lib/schema";

type RatingPatchBody = {
  userRating?: unknown;
};

export async function PATCH(context: APIContext): Promise<Response> {
  const { userId: clerkId } = context.locals.auth();

  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { slug } = context.params;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), { status: 400 });
  }

  let body: RatingPatchBody;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  const userRating = parseUserRating(body.userRating);
  if (userRating === null) {
    return new Response(JSON.stringify({ error: "userRating must be a number between 0 and 10" }), {
      status: 400,
    });
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const updated = await db
    .update(visits)
    .set({ userRating: String(userRating) })
    .where(and(eq(visits.userId, user.id), eq(visits.postSlug, slug)))
    .returning({ id: visits.id });

  if (updated.length === 0) {
    return new Response(JSON.stringify({ error: "Mark this place as visited before rating it" }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify({ userRating }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(context: APIContext): Promise<Response> {
  const { userId: clerkId } = context.locals.auth();

  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { slug } = context.params;

  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), { status: 400 });
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  await db.delete(visits).where(and(eq(visits.userId, user.id), eq(visits.postSlug, slug)));

  return new Response(null, { status: 204 });
}
