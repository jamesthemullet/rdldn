import { createHmac, timingSafeEqual } from "node:crypto";
import type { APIRoute } from "astro";
import { kv } from "../../../lib/kv";

const TOKEN_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours
const RATE_LIMIT = 10;
const RATE_WINDOW_S = 60 * 60; // 1 hour

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `rate:submit:${ip}`;
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, RATE_WINDOW_S);
  return count <= RATE_LIMIT;
}

function verifyToken(token: string): boolean {
  const secret = import.meta.env.SCORE_SECRET;
  if (!secret) return false;

  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [nonce, timestamp, sig] = parts;
  const age = Date.now() - Number.parseInt(timestamp, 10);
  if (Number.isNaN(age) || age > TOKEN_MAX_AGE_MS || age < 0) return false;

  const expected = createHmac("sha256", secret)
    .update(`${nonce}:${timestamp}`)
    .digest("hex");

  if (expected.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

export const POST: APIRoute = async ({ request }) => {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!(await checkRateLimit(ip))) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

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
  await kv.zremrangebyrank("leaderboard", 0, -101); // keep top 100

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
