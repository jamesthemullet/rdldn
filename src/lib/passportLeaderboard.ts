import { kv } from "./kv";

export const LEADERBOARD_KEY = "passport-leaderboard";
export const LEADERBOARD_SIZE = 10;
export const MAX_DISPLAY_NAME_LENGTH = 30;

export type PassportLeaderboardEntry = {
  displayName: string;
  visits: number;
  badges: number;
};

function metaKey(userId: string): string {
  return `${LEADERBOARD_KEY}-meta:${userId}`;
}

export function sanitizeDisplayName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

export async function setLeaderboardEntry(userId: string, entry: PassportLeaderboardEntry): Promise<void> {
  await kv.zadd(LEADERBOARD_KEY, { score: entry.visits, member: userId });
  await kv.set(metaKey(userId), entry);
  await kv.zremrangebyrank(LEADERBOARD_KEY, 0, -101); // keep top 100
}

export async function removeLeaderboardEntry(userId: string): Promise<void> {
  await kv.zrem(LEADERBOARD_KEY, userId);
  await kv.del(metaKey(userId));
}

export async function getLeaderboardEntries(): Promise<PassportLeaderboardEntry[]> {
  try {
    const ids = (await kv.zrange(LEADERBOARD_KEY, 0, LEADERBOARD_SIZE - 1, { rev: true })) as string[];
    if (ids.length === 0) return [];

    const metas = await Promise.all(ids.map((id) => kv.get<PassportLeaderboardEntry>(metaKey(id))));
    return metas.filter((meta): meta is PassportLeaderboardEntry => meta !== null && meta !== undefined);
  } catch {
    return [];
  }
}
