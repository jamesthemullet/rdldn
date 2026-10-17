import type { APIContext } from "astro";
import { and, eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { users, wishlistItems } from "../../lib/schema";
import { isNonEmptyString, isOptionalNullableString } from "../../lib/validation";

type WishlistPostBody = {
  postSlug: string;
  postTitle: string;
  postRating?: string | null;
};

function isValidWishlistPostBody(body: unknown): body is WishlistPostBody {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const { postSlug, postTitle, postRating } = body as Record<string, unknown>;
  return isNonEmptyString(postSlug) && isNonEmptyString(postTitle) && isOptionalNullableString(postRating);
}

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
    return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
  }

  const items = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId))
    .orderBy(wishlistItems.savedAt);

  return new Response(JSON.stringify(items), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(context: APIContext): Promise<Response> {
  const { userId: clerkId } = context.locals.auth();

  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  if (!isValidWishlistPostBody(body)) {
    return new Response(JSON.stringify({ error: "postSlug and postTitle are required" }), { status: 400 });
  }

  const { postSlug, postTitle, postRating } = body;

  let userId = await getUserId(clerkId);
  if (!userId) {
    const [newUser] = await db.insert(users).values({ clerkId, email: "" }).returning({ id: users.id });
    userId = newUser.id;
  }

  const existing = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.postSlug, postSlug)))
    .limit(1);

  if (existing.length > 0) {
    return new Response(JSON.stringify({ saved: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  await db.insert(wishlistItems).values({
    userId,
    postSlug,
    postTitle,
    postRating: postRating ?? null,
  });

  return new Response(JSON.stringify({ saved: true }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
