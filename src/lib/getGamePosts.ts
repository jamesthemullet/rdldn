import type { Post, PostsConnection } from "../types";
import { fetchGraphQL } from "./api";
import GET_GAME_POSTS from "./queries/getGamePosts";

type PostsResponse = {
  posts: PostsConnection;
};

let gamePostsPromise: Promise<Post[]> | null = null;

async function fetchGamePosts(): Promise<Post[]> {
  let hasNextPage = true;
  let endCursor: string | null = null;
  const allPosts: Post[] = [];

  while (hasNextPage) {
    const variables: { after?: string } = endCursor ? { after: endCursor } : {};
    const data = await fetchGraphQL<PostsResponse>(GET_GAME_POSTS, variables);
    const posts = data?.posts;
    const nodes = posts?.nodes ?? [];
    allPosts.push(...nodes);

    hasNextPage = posts?.pageInfo?.hasNextPage ?? false;
    endCursor = posts?.pageInfo?.endCursor ?? null;
  }

  return allPosts;
}

export function resetGamePostsCache(): void {
  gamePostsPromise = null;
}

export async function getGamePosts(): Promise<Post[]> {
  if (!gamePostsPromise) {
    gamePostsPromise = fetchGamePosts().catch((error) => {
      gamePostsPromise = null;
      throw error;
    });
  }

  return gamePostsPromise;
}
