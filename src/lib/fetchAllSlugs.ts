import { fetchGraphQL } from "./api";

type SlugNode = { slug: string };

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
    const data = (await fetchGraphQL(query, {
      first: 100,
      after: endCursor,
    })) as SlugsResponse;

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
