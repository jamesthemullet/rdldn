import { fetchGraphQL } from "./api";

type SlugNode = { slug: string; modified: string; commentCount: number | null };

type GraphEntity = "posts" | "pages";

type SlugsResponse = {
  [K in GraphEntity]: {
    nodes: SlugNode[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

export async function fetchAllSlugs(entity: GraphEntity, query: string): Promise<SlugNode[]> {
  const allItems: SlugNode[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;

  while (hasNextPage) {
    const data: SlugsResponse = await fetchGraphQL<SlugsResponse>(query, {
      first: 100,
      after: endCursor,
    });

    const items = data[entity].nodes;

    if (Array.isArray(items)) {
      allItems.push(...items);
    } else {
      console.warn("Warning: items is not an array", items, data);
    }

    hasNextPage = data[entity].pageInfo.hasNextPage;
    endCursor = data[entity].pageInfo.endCursor;
  }

  return allItems;
}

// Lets incremental builds reuse a prerendered page until its content or comments change.
// The year is included because the page renders text relative to the current year.
export function buildSlugCacheKey({ modified, commentCount }: SlugNode): string {
  return `${new Date().getFullYear()}:${modified}:${commentCount ?? 0}`;
}
