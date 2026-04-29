import { fetchGraphQL } from "./api";
import GET_ALL_POSTS from "./queries/getAllPosts";
import type { Post, PostsConnection } from "../types";

const getMedian = (arr: number[]): number => {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export function computeInflationIndex(posts: Post[]): {
  inflationIndex: Record<string, number>;
  mostRecentYear: string;
} {
  const yearPrices = new Map<string, number[]>();

  for (const post of posts) {
    const year = post.yearsOfVisit?.nodes[0]?.name;
    const priceStr = post.prices?.nodes[0]?.name;
    if (!year || !priceStr) continue;
    const match = priceStr.match(/[\d,.]+/);
    if (!match) continue;
    const price = Number.parseFloat(match[0].replace(",", ""));
    if (!Number.isNaN(price) && price > 0) {
      const arr = yearPrices.get(year) ?? [];
      arr.push(price);
      yearPrices.set(year, arr);
    }
  }

  const yearMedians: Record<string, number> = {};
  for (const [year, prices] of yearPrices.entries()) {
    yearMedians[year] = getMedian(prices);
  }

  const mostRecentYear = Object.keys(yearMedians).sort().at(-1) ?? "";
  const mostRecentMedian = mostRecentYear ? yearMedians[mostRecentYear] : 0;

  const inflationIndex: Record<string, number> = {};
  if (mostRecentMedian > 0) {
    for (const [year, median] of Object.entries(yearMedians)) {
      inflationIndex[year] = mostRecentMedian / median;
    }
  }

  return { inflationIndex, mostRecentYear };
}

export async function buildInflationIndex(): Promise<{
  inflationIndex: Record<string, number>;
  mostRecentYear: string;
}> {
  const allPosts: Post[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;

  while (hasNextPage) {
    const variables: { after?: string } = endCursor ? { after: endCursor } : {};
    const { posts } = await fetchGraphQL<{ posts: PostsConnection }>(GET_ALL_POSTS, variables);
    allPosts.push(...(posts.nodes as Post[]));
    hasNextPage = posts.pageInfo.hasNextPage;
    endCursor = posts.pageInfo.endCursor;
  }

  return computeInflationIndex(allPosts);
}
