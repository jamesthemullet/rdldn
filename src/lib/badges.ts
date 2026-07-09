import type { Post } from "../types";
import type { Visit } from "./schema";

export type Badge = {
  key: string;
  name: string;
  description: string;
};

export const BADGES: Badge[] = [
  { key: "first-roast", name: "First Roast", description: "Log your first visit" },
  { key: "zone-trotter", name: "Zone Trotter", description: "Visit a restaurant in every TFL fare zone" },
  { key: "carnivore", name: "Carnivore", description: "Try at least 5 different meats" },
  {
    key: "north-south-divide",
    name: "North-South Divide",
    description: "Visit at least one restaurant in North and South London",
  },
  {
    key: "all-rounder",
    name: "All-Rounder",
    description: "Visit at least one restaurant in every major area (N/S/E/W/Central)",
  },
  { key: "century-club", name: "Century Club", description: "Log 100 visits" },
  { key: "gold-standard", name: "Gold Standard", description: "Visit 10 restaurants rated 8.5+ by Lord Gravy" },
  {
    key: "bargain-hunter",
    name: "Bargain Hunter",
    description: "Visit 5 restaurants priced under £15 with a rating above 8",
  },
  { key: "loyal-subject", name: "Loyal Subject", description: "Visit the same restaurant 3+ times" },
];

const MAJOR_AREAS = ["North London", "South London", "East London", "West London", "Central London"];

const getAreaNames = (post: Post): string[] => post.areas?.nodes.map((node) => node.name) ?? [];
const getZoneNames = (post: Post): string[] => post.zones?.nodes.map((node) => node.name) ?? [];
const getMeatNames = (post: Post): string[] => post.meats?.nodes.map((node) => node.name) ?? [];
const getPostRating = (post: Post): number => Number.parseFloat(post.ratings?.nodes[0]?.name ?? "");

const parsePrice = (priceStr: string | undefined): number | null => {
  if (!priceStr) return null;
  const match = priceStr.match(/[\d,.]+/);
  if (!match) return null;
  const price = Number.parseFloat(match[0].replace(",", ""));
  return !Number.isNaN(price) && price > 0 ? price : null;
};

function getAllZones(posts: Post[]): Set<string> {
  const zones = new Set<string>();
  posts.forEach((post) => {
    getZoneNames(post).forEach((zone) => {
      zones.add(zone);
    });
  });
  return zones;
}

export function computeEarnedBadges(visits: Visit[], posts: Post[]): Badge[] {
  if (visits.length === 0) return [];

  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));
  const earnedKeys = new Set<string>(["first-roast"]);

  const visitCountBySlug = new Map<string, number>();
  const visitedZones = new Set<string>();
  const visitedAreas = new Set<string>();
  const visitedMeats = new Set<string>();
  let goldStandardCount = 0;
  let bargainCount = 0;

  for (const visit of visits) {
    visitCountBySlug.set(visit.postSlug, (visitCountBySlug.get(visit.postSlug) ?? 0) + 1);

    const post = postsBySlug.get(visit.postSlug);
    if (!post) continue;

    getZoneNames(post).forEach((zone) => {
      visitedZones.add(zone);
    });
    getAreaNames(post).forEach((area) => {
      visitedAreas.add(area);
    });
    getMeatNames(post).forEach((meat) => {
      visitedMeats.add(meat);
    });

    const rating = getPostRating(post);
    const price = parsePrice(post.prices?.nodes[0]?.name);

    if (!Number.isNaN(rating) && rating >= 8.5) goldStandardCount++;
    if (!Number.isNaN(rating) && rating > 8 && price !== null && price < 15) bargainCount++;
  }

  if (visits.length >= 100) earnedKeys.add("century-club");
  if (visitedMeats.size >= 5) earnedKeys.add("carnivore");
  if (visitedAreas.has("North London") && visitedAreas.has("South London")) {
    earnedKeys.add("north-south-divide");
  }
  if (MAJOR_AREAS.every((area) => visitedAreas.has(area))) earnedKeys.add("all-rounder");
  if (goldStandardCount >= 10) earnedKeys.add("gold-standard");
  if (bargainCount >= 5) earnedKeys.add("bargain-hunter");
  if ([...visitCountBySlug.values()].some((count) => count >= 3)) earnedKeys.add("loyal-subject");

  const allZones = getAllZones(posts);
  if (allZones.size > 0 && [...allZones].every((zone) => visitedZones.has(zone))) {
    earnedKeys.add("zone-trotter");
  }

  return BADGES.filter((badge) => earnedKeys.has(badge.key));
}
