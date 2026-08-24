import type { Post, PostsConnection } from "../types";
import { fetchGraphQL } from "./api";
import GET_YEARLY_STATS_POSTS from "./queries/getYearlyStatsPosts";

type PostsResponse = {
  posts: PostsConnection;
};

let yearlyStatsPostsPromise: Promise<Post[]> | null = null;

async function fetchYearlyStatsPosts(): Promise<Post[]> {
  let hasNextPage = true;
  let endCursor: string | null = null;
  const allPosts: Post[] = [];

  while (hasNextPage) {
    const variables: { after?: string } = endCursor ? { after: endCursor } : {};
    const data = await fetchGraphQL<PostsResponse>(GET_YEARLY_STATS_POSTS, variables);
    const posts = data?.posts;
    const nodes = posts?.nodes ?? [];
    allPosts.push(...nodes);

    hasNextPage = posts?.pageInfo?.hasNextPage ?? false;
    endCursor = posts?.pageInfo?.endCursor ?? null;
  }

  return allPosts;
}

export function resetYearlyStatsPostsCache(): void {
  yearlyStatsPostsPromise = null;
}

export async function getYearlyStatsPosts(): Promise<Post[]> {
  if (!yearlyStatsPostsPromise) {
    yearlyStatsPostsPromise = fetchYearlyStatsPosts().catch((error) => {
      yearlyStatsPostsPromise = null;
      throw error;
    });
  }

  return yearlyStatsPostsPromise;
}
