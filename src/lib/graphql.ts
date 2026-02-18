import { fetchGraphQL } from "../lib/api";
import type { Page, Post } from "../types";
import GET_ALL_POSTS from "./queries/getAllPosts";
import GET_POSTS_BY_DATE from "./queries/getPostsByDate";
import SINGLE_PAGE_QUERY_PREVIEW from "./queries/singlePage";

type PostsConnection = {
  nodes: Post[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
};

type FetchAllPostsResponse = {
  posts: PostsConnection;
};

type HighRatedRoast = {
  name: string;
  slug: string;
  rating: string;
};

const getPostRating = (post: Post): number =>
  Number.parseFloat(post.ratings?.nodes?.[0]?.name || "0");

const isPostOpen = (post: Post): boolean =>
  !(post.closedDowns?.nodes?.[0]?.name || "");

const fetchFilteredRoasts = async ({
  minRating,
  matcher,
}: {
  minRating: number;
  matcher: (post: Post) => boolean;
}): Promise<Post[]> => {
  const allPosts: Post[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;

  while (hasNextPage) {
    const variables: { after?: string } = endCursor ? { after: endCursor } : {};
    const { posts } = await fetchGraphQL(
      GET_ALL_POSTS,
      variables
    ) as FetchAllPostsResponse;

    const filtered = posts.nodes.filter((post) => {
      const rating = getPostRating(post);
      return matcher(post) && isPostOpen(post) && !Number.isNaN(rating) && rating > minRating;
    });

    allPosts.push(...filtered);
    hasNextPage = posts.pageInfo.hasNextPage;
    endCursor = posts.pageInfo.endCursor;
  }

  return allPosts.sort(
    (a, b) => getPostRating(b) - getPostRating(a)
  );
};

export const fetchTopRatedRoastsByFilter = async ({
  matcher,
  minRating = 0,
  limit = 5,
}: {
  matcher: (post: Post) => boolean;
  minRating?: number;
  limit?: number;
}): Promise<Post[]> => {
  const filteredRoasts = await fetchFilteredRoasts({ matcher, minRating });
  return filteredRoasts.slice(0, limit);
};

export const fetchTopRatedRoasts = async (
  area: string
): Promise<{ topRated: Post[]; highRated: HighRatedRoast[] }> => {
  const allPosts = await fetchFilteredRoasts({
    matcher: (post) => post.areas?.nodes?.[0]?.name === area,
    minRating: 0,
  });

  const topRated = allPosts
    .slice(0, 5);


  const topRatedSlugs = new Set(topRated.map((post) => post.slug));

  const highRated = allPosts
    .filter((post) => {
      const rating = getPostRating(post);
      return rating >= 8 && !topRatedSlugs.has(post.slug);
    })
    .map((post) => ({
      name: post.title || "",
      slug: post.slug || "",
      rating: getPostRating(post).toFixed(2),
    }));

  return { topRated, highRated };
}

export const fetchPageData = async (id: string): Promise<Page> => {
  try {
    const { page }: { page: Page | null } = await fetchGraphQL(
      SINGLE_PAGE_QUERY_PREVIEW,
      { id }
    );

    if (!page) {
      throw new Error("No single page data found");
    }

    return page;
  } catch (error) {
    console.error("Error fetching GraphQL data:", error);
    throw error;
  }
}

export const fetchPostsByDate = async (date: string) => {
  const [year, month] = date.split("-");
  const variables = { year: Number.parseInt(year), month: Number.parseInt(month) };

  const response = await fetchGraphQL(GET_POSTS_BY_DATE, variables);
  if (!response || !response.posts) {
    throw new Error("Failed to fetch posts by date");
  }

  return response.posts.nodes;
}