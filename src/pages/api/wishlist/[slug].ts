import type { APIContext } from "astro";
import { and, eq } from "drizzle-orm";
import { db } from "../../../lib/db";
import { users, wishlistItems } from "../../../lib/schema";

export async function DELETE(context: APIContext): Promise<Response> {
  const { userId: clerkId } = context.locals.auth();

  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { slug } = context.params;

  if (!slug) {
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.postSlug, slug)));

  return new Response(null, { status: 204 });
}
