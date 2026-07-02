import { fetchGraphQL } from "../lib/api";
import type { Page, Post } from "../types";
import { getAllRoastDinnerPosts } from "./getAllRoastDinnerPosts";
import GET_POSTS_BY_DATE from "./queries/getPostsByDate";
import SINGLE_PAGE_QUERY_PREVIEW from "./queries/singlePage";
import { getPostRating } from "./utils";

type HighRatedRoast = {
  name: string;
  slug: string;
  rating: string;
};

const isPostOpen = (post: Post): boolean =>
  !(post.closedDowns?.nodes?.[0]?.name || "");

const fetchFilteredRoasts = async ({
  minRating,
  matcher,
}: {
  minRating: number;
  matcher: (post: Post) => boolean;
}): Promise<Post[]> => {
  const allPosts = await getAllRoastDinnerPosts();

  return allPosts
    .filter((post) => {
      const rating = getPostRating(post);
      return matcher(post) && isPostOpen(post) && !Number.isNaN(rating) && rating > minRating;
    })
    .sort((a, b) => getPostRating(b) - getPostRating(a));
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
    const { page } = await fetchGraphQL<{ page: Page | null }>(
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

export const fetchPostsByDate = async (date: string): Promise<Post[]> => {
  const [year, month] = date.split("-");
  const variables = { year: Number.parseInt(year, 10), month: Number.parseInt(month, 10) };

  const response = await fetchGraphQL<{ posts: { nodes: Post[] } }>(GET_POSTS_BY_DATE, variables);

  if (!response?.posts) {
    throw new Error("Failed to fetch posts by date");
  }

  return response.posts.nodes;
}