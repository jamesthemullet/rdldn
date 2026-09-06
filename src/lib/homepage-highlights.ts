import type { Page, Post, Size } from "../types";
import { fetchGraphQL } from "./api";
import GET_BEST_ROASTS from "./queries/bestRoasts";
import GET_ALL_PAGES from "./queries/getAllPages";
import GET_FEATURE_POSTS from "./queries/getFeaturePosts.ts";
import SINGLE_PAGE_QUERY_PREVIEW from "./queries/singlePage";
import { sanitizeTitle } from "./sanitize";

export type HighlightItem = {
  slug: string;
  title: string;
  featuredImageUrl?: string;
};

export type BestRoastHighlight = HighlightItem & {
  rating?: string;
  yearVisited?: string;
};

export type HomepageHighlights = {
  bestRoasts: BestRoastHighlight[];
  features: HighlightItem[];
  roastStatistics: HighlightItem[];
};

const toHighlight = (item: {
  slug?: string;
  title?: string;
  featuredImageUrl?: string;
}): HighlightItem => ({
  slug: item.slug ?? "",
  title: sanitizeTitle(item.title),
  featuredImageUrl: item.featuredImageUrl,
});

const fetchBestRoasts = async (): Promise<BestRoastHighlight[]> => {
  try {
    const response = (await fetchGraphQL(GET_BEST_ROASTS)) as {
      posts: { nodes: Post[] };
    };
    const bestRoasts = response?.posts?.nodes
      ?.map((post: Post) => {
        const featuredImage = post.featuredImage?.node;
        const smallImage =
          featuredImage?.mediaDetails?.sizes.find(
            (size: Size) => size.name === "homepage"
          )?.sourceUrl || featuredImage?.sourceUrl;

        return {
          ...toHighlight({ slug: post.slug, title: post.title, featuredImageUrl: smallImage }),
          rating: post.ratings?.nodes?.[0]?.name,
          yearVisited: post.yearsOfVisit?.nodes?.[0]?.name,
        };
      })
      .filter(Boolean) as BestRoastHighlight[];
    return bestRoasts.sort(() => Math.random() - 0.5).slice(0, 4);
  } catch (error) {
    console.error("Error fetching best roasts:", error);
    return [];
  }
};

const fetchAllPagesData = async (): Promise<{
  pageFeatures: HighlightItem[];
  roastStatistics: HighlightItem[];
}> => {
  try {
    const response = (await fetchGraphQL(GET_ALL_PAGES)) as {
      pages: { nodes: Page[] };
    };
    const pages = response?.pages?.nodes ?? [];

    const toPageHighlight = (page: Page): HighlightItem => {
      const featuredImage = page.featuredImage?.node;
      const smallImage =
        featuredImage?.mediaDetails?.sizes.find((size: Size) => size.name === "homepage")
          ?.sourceUrl || featuredImage?.sourceUrl;

      return toHighlight({ slug: page.slug, title: page.title, featuredImageUrl: smallImage });
    };

    const pageFeatures = pages
      .filter((page: Page) => page?.highlights?.tag === "feature")
      .map(toPageHighlight);

    const roastStatistics = pages
      .filter((page: Page) => page?.highlights?.tag === "roastatistics")
      .map(toPageHighlight);

    return { pageFeatures, roastStatistics };
  } catch (error) {
    console.error("Error fetching features data:", error);
    return { pageFeatures: [], roastStatistics: [] };
  }
};

const fetchFeaturePosts = async (): Promise<HighlightItem[]> => {
  try {
    const postsResponse = (await fetchGraphQL(GET_FEATURE_POSTS)) as {
      posts: { edges: Array<{ node: Post }> };
    };

    return postsResponse.posts.edges.map(({ node }) => {
      const featuredImageUrl =
        node.featuredImage?.node?.mediaDetails?.sizes?.find(
          (size: Size) => size.name === "homepage"
        )?.sourceUrl || node.featuredImage?.node?.sourceUrl;

      return toHighlight({ slug: node.slug, title: node.title, featuredImageUrl });
    });
  } catch (error) {
    console.error("Error fetching feature posts:", error);
    return [];
  }
};

const fetchRoastStatsSinglePage = async (): Promise<HighlightItem | null> => {
  try {
    const response = (await fetchGraphQL(SINGLE_PAGE_QUERY_PREVIEW, {
      id: "4102",
    })) as { page: Page | null };

    if (!response?.page) return null;

    const featuredImageUrl =
      response.page.featuredImage?.node?.mediaDetails?.sizes?.find(
        (size: Size) => size.name === "homepage"
      )?.sourceUrl || response.page.featuredImage?.node?.sourceUrl;

    return toHighlight({
      slug: response.page.slug,
      title: response.page.title,
      featuredImageUrl,
    });
  } catch (error) {
    console.error("Error fetching features data:", error);
    return null;
  }
};

export const getHomepageHighlights = async (): Promise<HomepageHighlights> => {
  const [bestRoasts, allPagesData, featurePosts, roastStatsSinglePage] = await Promise.all([
    fetchBestRoasts(),
    fetchAllPagesData(),
    fetchFeaturePosts(),
    fetchRoastStatsSinglePage(),
  ]);

  let features: HighlightItem[] = [...allPagesData.pageFeatures, ...featurePosts];
  features = features.sort(() => Math.random() - 0.5).slice(0, 4);

  const roastStatistics = allPagesData.roastStatistics.sort(() => Math.random() - 0.5).slice(0, 3);

  if (roastStatsSinglePage) {
    roastStatistics.unshift(roastStatsSinglePage);
  }

  return { bestRoasts, features, roastStatistics };
};
