import type { Page } from "../types";
import { fetchGraphQL } from "./api";
import SINGLE_PAGE_QUERY_PREVIEW from "./queries/singlePage";

type SinglePageResponse = {
  page: Page | null;
};

type SinglePageDataOptions = {
  variables: Record<string, unknown>;
  query?: string;
};

export async function getSinglePageData({
  variables,
  query = SINGLE_PAGE_QUERY_PREVIEW
}: SinglePageDataOptions): Promise<Page> {
  let singlePage: Page | null = null;

  try {
    const { page } = (await fetchGraphQL(query, variables)) as SinglePageResponse;
    singlePage = page;
  } catch (error) {
    console.error("Error fetching GraphQL data:", error);
  }

  if (!singlePage) {
    throw new Error("No single page data found");
  }

  return singlePage;
}
