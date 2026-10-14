export type RatingColor = {
  color: string;
  background: string;
};

type RatingColorThreshold = RatingColor & { min: number };

export const RATING_COLOR_THRESHOLDS: RatingColorThreshold[] = [
  { min: 9, color: "#fff", background: "#4B0082" },
  { min: 8.5, color: "#fff", background: "#83539B" },
  { min: 8, color: "#fff", background: "#588EB5" },
  { min: 7.5, color: "#000", background: "#51A790" },
  { min: 7, color: "#000", background: "#4D7833" },
  { min: 6.5, color: "#000", background: "#6A972A" },
  { min: 6, color: "#000", background: "#CFB920" },
  { min: 5, color: "#fff", background: "#CF7C1D" },
  { min: 4, color: "#fff", background: "#FF0000" },
  { min: 3, color: "#fff", background: "#8B0000" },
];

export const DEFAULT_RATING_COLOR: RatingColor = { color: "#fff", background: "#000000" };

export const getRatingColor = (rating: number): RatingColor => {
  if (!Number.isFinite(rating)) return DEFAULT_RATING_COLOR;
  const threshold = RATING_COLOR_THRESHOLDS.find(({ min }) => rating >= min);
  return threshold ? { color: threshold.color, background: threshold.background } : DEFAULT_RATING_COLOR;
};
