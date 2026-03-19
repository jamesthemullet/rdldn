import { createClient } from "@vercel/kv";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

await kv.del("leaderboard");
console.log("Leaderboard cleared.");
