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

export async function getAllRoastDinnerPosts(): Promise<Post[]> {
  let hasNextPage = true;
  let endCursor: string | null = null;
  const allPosts: Post[] = [];

  while (hasNextPage) {
    const variables = endCursor ? { after: endCursor } : {};
    const data = (await fetchGraphQL(GET_ALL_POSTS, variables)) as PostsResponse;
    const posts = data?.posts;
    const nodes = posts?.nodes ?? [];
    allPosts.push(...nodes);

    hasNextPage = posts?.pageInfo?.hasNextPage ?? false;
    endCursor = posts?.pageInfo?.endCursor ?? null;
  }

  return allPosts;
}
