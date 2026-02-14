import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Page } from "../types";
import { fetchGraphQL } from "./api";
import { getSinglePageData } from "./getSinglePageData";
import SINGLE_PAGE_QUERY_PREVIEW from "./queries/singlePage";

vi.mock("./api", () => ({
  fetchGraphQL: vi.fn()
}));

const mockFetchGraphQL = fetchGraphQL as unknown as Mock;

describe("getSinglePageData", () => {
  beforeEach(() => {
    mockFetchGraphQL.mockReset();
    vi.restoreAllMocks();
  });

  it("returns page data with the default query", async () => {
    const page = {
      id: "page-id",
      pageId: "10608",
      title: "Test Page"
    } as Page;

    mockFetchGraphQL.mockResolvedValueOnce({ page });

    const result = await getSinglePageData({ variables: { id: "10608" } });

    expect(result).toBe(page);
    expect(mockFetchGraphQL).toHaveBeenCalledWith(SINGLE_PAGE_QUERY_PREVIEW, {
      id: "10608"
    });
  });

  it("passes through a custom query", async () => {
    const page = {
      id: "page-id",
      pageId: "42",
      title: "Custom Query Page"
    } as Page;
    const customQuery = "query CustomSinglePage($id: ID!) { page(id: $id) { id } }";

    mockFetchGraphQL.mockResolvedValueOnce({ page });

    const result = await getSinglePageData({
      query: customQuery,
      variables: { id: "42" }
    });

    expect(result).toBe(page);
    expect(mockFetchGraphQL).toHaveBeenCalledWith(customQuery, { id: "42" });
  });

  it("logs and throws when GraphQL request fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const error = new Error("Network down");

    mockFetchGraphQL.mockRejectedValueOnce(error);

    await expect(getSinglePageData({ variables: { id: "10608" } })).rejects.toThrow(
      "No single page data found"
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching GraphQL data:",
      error
    );
  });

  it("throws when response has no page", async () => {
    mockFetchGraphQL.mockResolvedValueOnce({ page: null });

    await expect(getSinglePageData({ variables: { id: "10608" } })).rejects.toThrow(
      "No single page data found"
    );
  });
});
