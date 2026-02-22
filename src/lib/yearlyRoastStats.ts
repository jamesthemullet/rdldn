import type { Post } from "../types";

type YearlyRoastStats = Record<string, { matching: number; total: number }>;

export async function fetchAllPosts(
  fetchGraphQL: (query: string, variables?: Record<string, unknown>) => Promise<{
    posts: {
      nodes: Post[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  }>,
  query: string
): Promise<Post[]> {
  const allRoastPosts: Post[] = [];

  let hasNextPage = true;
  let endCursor: string | null = null;

  while (hasNextPage) {
    const variables = endCursor ? { after: endCursor } : {};
    const { posts } = await fetchGraphQL(query, variables);

    allRoastPosts.push(...posts.nodes);
    hasNextPage = posts.pageInfo.hasNextPage;
    endCursor = posts.pageInfo.endCursor;
  }

  return allRoastPosts;
}

export function buildYearlyRoastStats(
  posts: Post[],
  isMatchingRating: (rating: number) => boolean
): YearlyRoastStats {
  const roastDinnerPosts = posts.filter((post) =>
    post.typesOfPost?.nodes.some((type) => type.name === "Roast Dinner")
  );

  const stats: YearlyRoastStats = {};

  roastDinnerPosts.forEach((post) => {
    const yearTerm = post.yearsOfVisit?.nodes[0]?.name;
    if (!yearTerm) return;

    if (!stats[yearTerm]) {
      stats[yearTerm] = { matching: 0, total: 0 };
    }

    stats[yearTerm].total++;

    const ratingTerm = post.ratings?.nodes[0]?.name;
    const parsedRating = ratingTerm ? Number.parseFloat(ratingTerm) : Number.NaN;
    if (!Number.isNaN(parsedRating) && isMatchingRating(parsedRating)) {
      stats[yearTerm].matching++;
    }
  });

  return stats;
}