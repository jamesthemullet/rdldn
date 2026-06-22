import type { Post } from "../types";
import { fetchGraphQL } from "./api";
import GET_ALL_POSTS from "./queries/getAllPosts";

type PostsResponse = {
  posts: {
    nodes: Post[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

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

export function resetGetAllRoastDinnerPostsCache(): void {
  allRoastDinnerPostsPromise = null;
}

export async function getAllRoastDinnerPosts(): Promise<Post[]> {
  if (!allRoastDinnerPostsPromise) {
    allRoastDinnerPostsPromise = fetchAllRoastDinnerPosts().catch((error) => {
      allRoastDinnerPostsPromise = null;
      throw error;
    });
  }

  return allRoastDinnerPostsPromise;
}
