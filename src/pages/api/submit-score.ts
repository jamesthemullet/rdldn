import { createHmac } from "node:crypto";
import type { APIRoute } from "astro";
import { kv } from "../../lib/kv";

const TOKEN_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

function verifyToken(token: string): boolean {
  const secret = import.meta.env.SCORE_SECRET;
  if (!secret) return false;

  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [nonce, timestamp, sig] = parts;
  const age = Date.now() - Number.parseInt(timestamp, 10);
  if (isNaN(age) || age > TOKEN_MAX_AGE_MS || age < 0) return false;

  const expected = createHmac("sha256", secret)
    .update(`${nonce}:${timestamp}`)
    .digest("hex");

  return expected === sig;
}

export const POST: APIRoute = async ({ request }) => {
  let body: { name?: unknown; score?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { name, score, token } = body;

  if (typeof token !== "string" || !verifyToken(token)) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 30) {
    return new Response(JSON.stringify({ error: "Invalid name" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > 100) {
    return new Response(JSON.stringify({ error: "Invalid score" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const member = JSON.stringify({
    name: name.trim(),
    score,
    date: new Date().toISOString(),
  });

  await kv.zadd("leaderboard", { score, member });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
