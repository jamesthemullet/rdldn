import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { users } from "../../lib/schema";

export async function GET(context: APIContext) {
  const auth = context.locals.auth();
  const { userId: clerkId } = auth;

  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const clerkUser = context.locals.currentUser ? await context.locals.currentUser() : null;
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";

  const existing = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

  if (existing.length === 0) {
    await db.insert(users).values({ clerkId, email });
  }

  const [profile] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

  return new Response(JSON.stringify(profile), {
    headers: { "Content-Type": "application/json" },
  });
}
