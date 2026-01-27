import { fetchGraphQL } from "./api";

type SlugNode = { slug: string };

type GraphEntity = "posts" | "pages";

export async function fetchAllSlugs(entity: GraphEntity, query: string) {
  const allItems: SlugNode[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;

  while (hasNextPage) {
    const data = await fetchGraphQL(query, {
      first: 100,
      after: endCursor,
    });

    const items = data?.[entity]?.nodes as SlugNode[] | undefined;

    if (Array.isArray(items)) {
      allItems.push(...items);
    } else {
      console.warn("Warning: items is not an array", items, data);
    }

    hasNextPage = data?.[entity]?.pageInfo?.hasNextPage ?? false;
    endCursor = data?.[entity]?.pageInfo?.endCursor ?? null;
  }

  return allItems;
}
