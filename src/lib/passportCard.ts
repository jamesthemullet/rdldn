import { BADGES } from "./badges";

export type PassportCardData = {
  visits: number;
  zones: number;
  favouriteMeat: string | null;
  badgesEarned: number;
  totalBadges: number;
};

const MAX_MEAT_LENGTH = 24;

function parseCount(value: string | null, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, max);
}

function parseMeat(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().slice(0, MAX_MEAT_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

export function parsePassportCardParams(searchParams: URLSearchParams): PassportCardData {
  const totalBadges = BADGES.length;

  return {
    visits: parseCount(searchParams.get("visits"), 999_999),
    zones: parseCount(searchParams.get("zones"), 50),
    favouriteMeat: parseMeat(searchParams.get("meat")),
    badgesEarned: parseCount(searchParams.get("badges"), totalBadges),
    totalBadges,
  };
}
