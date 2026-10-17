import type { APIContext } from "astro";
import { and, eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { users, visits } from "../../lib/schema";
import { isNonEmptyString, isOptionalNullableString } from "../../lib/validation";

type VisitsPostBody = {
  postSlug: string;
  postTitle: string;
  postRating?: string | null;
  notes?: string | null;
};

function isValidVisitsPostBody(body: unknown): body is VisitsPostBody {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const { postSlug, postTitle, postRating, notes } = body as Record<string, unknown>;
  return (
    isNonEmptyString(postSlug) &&
    isNonEmptyString(postTitle) &&
    isOptionalNullableString(postRating) &&
    isOptionalNullableString(notes)
  );
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

  const items = await db.select().from(visits).where(eq(visits.userId, userId)).orderBy(visits.visitedAt);

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

  if (!isValidVisitsPostBody(body)) {
    return new Response(JSON.stringify({ error: "postSlug and postTitle are required" }), { status: 400 });
  }

  const { postSlug, postTitle, postRating, notes } = body;

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
