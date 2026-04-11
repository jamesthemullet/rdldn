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
  const { page } = (await fetchGraphQL(query, variables)) as SinglePageResponse;

  if (!page) {
    throw new Error("No single page data found");
  }

  return page;
}
