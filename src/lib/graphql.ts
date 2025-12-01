import { fetchGraphQL } from "../lib/api";
import GET_POSTS_BY_DATE from "./queries/getPostsByDate";

const GET_ALL_POSTS = `
  query GetAllPosts($after: String) {
    posts(after: $after, first: 10) {
      nodes {
        title
        slug
        areas {
          nodes {
            name
          }
        }
        closedDowns {
          nodes {
            name
          }
        }
        ratings {
          nodes {
            name
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        highlights {
          loved
          loathed
        }
        yearsOfVisit {
          nodes {
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const SINGLE_PAGE_QUERY_PREVIEW = `
  query SinglePageQueryPreview($id: ID!) {
    page(id: $id, idType: DATABASE_ID) {
      title
      content
      pageId
      seo {
        opengraphDescription
        opengraphImage {
          sourceUrl
        }
      }
      featuredImage {
        node {
          sourceUrl
        }
      }
      comments {
        nodes {
          id
          content
          parentId
        }
      }
    }
  }
`;

export const fetchTopRatedRoasts = async (area: string): Promise<{ topRated: any[]; highRated: any[] }> => {
  const allPosts: any[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;

  while (hasNextPage) {
    const variables: Record<string, any> = endCursor ? { after: endCursor } : {};
    const { posts }: { posts: any } = await fetchGraphQL(GET_ALL_POSTS, variables);

    const filtered = posts.nodes.filter((post: any) => {
      const postArea = post.areas?.nodes?.[0]?.name;
      const isClosed = post.closedDowns?.nodes[0]?.name || "";
      const rating = Number.parseFloat(post.ratings?.nodes?.[0]?.name || "0");

      return postArea === area && !isClosed && !isNaN(rating);
    });

    allPosts.push(...filtered);
    hasNextPage = posts.pageInfo.hasNextPage;
    endCursor = posts.pageInfo.endCursor;
  }

  const topRated = allPosts
    .sort((a, b) => Number.parseFloat(b.ratings?.nodes?.[0]?.name || "") - Number.parseFloat(a.ratings?.nodes?.[0]?.name || ""))
    .slice(0, 5);

  console.log(20, topRated);

  const topRatedSlugs = new Set(topRated.map((post) => post.slug));

  const highRated = allPosts
    .filter((post) => {
      const rating = Number.parseFloat(post.ratings?.nodes?.[0]?.name || "0");
      return rating >= 8 && !topRatedSlugs.has(post.slug);
    })
    .map((post) => ({
      name: post.title,
      slug: post.slug,
      rating: Number.parseFloat(post.ratings?.nodes?.[0]?.name || "0").toFixed(2),
    }));

  return { topRated, highRated };
}

export const fetchPageData = async (id: string): Promise<any> => {
  const variables: Record<string, any> = { id };
  const { page }: { page: any } = await fetchGraphQL(SINGLE_PAGE_QUERY_PREVIEW, variables);
  return page;
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