import type { Page, Post } from "../types";
import { fetchGraphQL } from "./api";
import GET_BEST_ROASTS from "./queries/bestRoasts";
import GET_ALL_PAGES from "./queries/getAllPages";
import GET_FEATURE_POSTS from "./queries/getFeaturePosts.ts";
import { buildHomepagePagesQuery, HOMEPAGE_LATEST_POSTS_QUERY } from "./queries/homepage";
import { sanitizeTitle } from "./sanitize";
import { shuffle } from "./shuffle";

export type HomepageCard = {
  slug: string;
  title: string;
  featuredImageUrl?: string;
  date?: string;
  rating?: string;
  yearVisited?: string;
};

export type HomepageData = {
  latestPosts: HomepageCard[];
  opengraphImage?: string;
  favouriteRoastPages: HomepageCard[];
  locationPages: HomepageCard[];
  bestRoasts: HomepageCard[];
  features: HomepageCard[];
  roastStatistics: HomepageCard[];
};

const FAVOURITE_ROAST_PAGE_IDS = ["267", "631", "10368", "17"];
const LOCATION_PAGE_IDS = ["5614", "5612", "5616", "5594"];
const ROASTATISTICS_PAGE_ID = "4102";

type FeaturedImage = Post["featuredImage"] | Page["featuredImage"];

const getHomepageImageUrl = (featuredImage: FeaturedImage | undefined): string | undefined => {
  const node = featuredImage?.node;
  return (
    node?.mediaDetails?.sizes?.find((size) => size.name === "homepage")?.sourceUrl ||
    node?.sourceUrl ||
    undefined
  );
};

const toCard = (item: {
  slug?: string;
  title?: string;
  featuredImage?: FeaturedImage;
}): HomepageCard => ({
  slug: item.slug ?? "",
  title: sanitizeTitle(item.title),
  featuredImageUrl: getHomepageImageUrl(item.featuredImage),
});

const hasSlug = (card: HomepageCard) => card.slug !== "";

// Each section fetches independently so one failing query never blanks the rest of the page.
const safely = async <T>(label: string, fallback: T, load: () => Promise<T>): Promise<T> => {
  try {
    return await load();
  } catch (error) {
    console.error(`Error fetching homepage ${label}:`, error);
    return fallback;
  }
};

const fetchLatestPosts = () =>
  safely("latest posts", { cards: [] as HomepageCard[], opengraphImage: undefined as string | undefined }, async () => {
    const data = await fetchGraphQL<{ posts?: { nodes?: Post[] } }>(HOMEPAGE_LATEST_POSTS_QUERY);
    const nodes = data?.posts?.nodes ?? [];
    return {
      cards: nodes.map((post) => ({ ...toCard(post), date: post.date })).filter(hasSlug),
      opengraphImage: nodes[0]?.seo?.opengraphImage?.sourceUrl,
    };
  });

const fetchPagesById = () =>
  safely("pages", {} as Record<string, HomepageCard>, async () => {
    const ids = [...FAVOURITE_ROAST_PAGE_IDS, ...LOCATION_PAGE_IDS, ROASTATISTICS_PAGE_ID];
    const data = await fetchGraphQL<Record<string, Page | null>>(buildHomepagePagesQuery(ids));
    const pages: Record<string, HomepageCard> = {};
    for (const id of ids) {
      const page = data?.[`p${id}`];
      if (page) pages[id] = toCard(page);
    }
    return pages;
  });

const fetchBestRoasts = () =>
  safely("best roasts", [] as HomepageCard[], async () => {
    const data = await fetchGraphQL<{ posts?: { nodes?: Post[] } }>(GET_BEST_ROASTS);
    return (data?.posts?.nodes ?? [])
      .map((post) => ({
        ...toCard(post),
        rating: post.ratings?.nodes?.[0]?.name,
        yearVisited: post.yearsOfVisit?.nodes?.[0]?.name,
      }))
      .filter(hasSlug);
  });

const fetchTaggedPages = () =>
  safely("tagged pages", { features: [] as HomepageCard[], roastStatistics: [] as HomepageCard[] }, async () => {
    const data = await fetchGraphQL<{ pages?: { nodes?: Page[] } }>(GET_ALL_PAGES);
    const pages = data?.pages?.nodes ?? [];
    const withTag = (tag: string) =>
      pages.filter((page) => page?.highlights?.tag === tag).map(toCard).filter(hasSlug);
    return { features: withTag("feature"), roastStatistics: withTag("roastatistics") };
  });

const fetchFeaturePosts = () =>
  safely("feature posts", [] as HomepageCard[], async () => {
    const data = await fetchGraphQL<{ posts?: { edges?: Array<{ node: Post }> } }>(GET_FEATURE_POSTS);
    return (data?.posts?.edges ?? []).map(({ node }) => toCard(node)).filter(hasSlug);
  });

export const getHomepageData = async (): Promise<HomepageData> => {
  const [latest, pagesById, bestRoasts, taggedPages, featurePosts] = await Promise.all([
    fetchLatestPosts(),
    fetchPagesById(),
    fetchBestRoasts(),
    fetchTaggedPages(),
    fetchFeaturePosts(),
  ]);

  const pickPages = (ids: string[]) =>
    ids.map((id) => pagesById[id]).filter((card): card is HomepageCard => Boolean(card));

  const roastStatsPage = pagesById[ROASTATISTICS_PAGE_ID];
  const otherRoastStatistics = shuffle(
    taggedPages.roastStatistics.filter((card) => card.slug !== roastStatsPage?.slug)
  ).slice(0, roastStatsPage ? 3 : 4);

  return {
    latestPosts: latest.cards,
    opengraphImage: latest.opengraphImage,
    favouriteRoastPages: pickPages(FAVOURITE_ROAST_PAGE_IDS),
    locationPages: pickPages(LOCATION_PAGE_IDS),
    bestRoasts: shuffle(bestRoasts).slice(0, 4),
    features: shuffle([...taggedPages.features, ...featurePosts]).slice(0, 4),
    roastStatistics: roastStatsPage ? [roastStatsPage, ...otherRoastStatistics] : otherRoastStatistics,
  };
};
