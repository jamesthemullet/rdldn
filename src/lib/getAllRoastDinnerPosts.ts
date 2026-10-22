import type { Post, PostsConnection } from "../types";
import { fetchGraphQL } from "./api";
import { kv } from "./kv";
import GET_ALL_POSTS from "./queries/getAllPosts";

type PostsResponse = {
  posts: PostsConnection;
};

const KV_CACHE_KEY = "all-roast-dinner-posts";
const KV_CACHE_TTL_SECONDS = 5 * 60;

let allRoastDinnerPostsPromise: Promise<Post[]> | null = null;

async function fetchAllRoastDinnerPosts(): Promise<Post[]> {
  let hasNextPage = true;
  let endCursor: string | null = null;
  const allPosts: Post[] = [];

  while (hasNextPage) {
    const variables: { after?: string } = endCursor ? { after: endCursor } : {};
    const data = await fetchGraphQL<PostsResponse>(GET_ALL_POSTS, variables);
    const posts = data?.posts;
    const nodes = posts?.nodes ?? [];
    allPosts.push(...nodes);

    hasNextPage = posts?.pageInfo?.hasNextPage ?? false;
    endCursor = posts?.pageInfo?.endCursor ?? null;
  }

  return allPosts;
}

async function getCachedPosts(): Promise<Post[] | null> {
  try {
    const cached = await kv.get<Post[]>(KV_CACHE_KEY);
    return cached ?? null;
  } catch {
    // KV unavailable - fall back to a network fetch below.
    return null;
  }
}

async function setCachedPosts(posts: Post[]): Promise<void> {
  try {
    await kv.set(KV_CACHE_KEY, posts, { ex: KV_CACHE_TTL_SECONDS });
  } catch {
    // KV unavailable - the fetched posts are still returned to the caller.
  }
}

export function resetGetAllRoastDinnerPostsCache(): void {
  allRoastDinnerPostsPromise = null;
}

export async function getAllRoastDinnerPosts(): Promise<Post[]> {
  if (!allRoastDinnerPostsPromise) {
    allRoastDinnerPostsPromise = (async () => {
      const cached = await getCachedPosts();
      if (cached) {
        return cached;
      }

      const posts = await fetchAllRoastDinnerPosts();
      await setCachedPosts(posts);
      return posts;
    })().catch((error) => {
      allRoastDinnerPostsPromise = null;
      throw error;
    });
  }

  return allRoastDinnerPostsPromise;
}
