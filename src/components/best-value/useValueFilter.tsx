import { type ChangeEvent, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { ValueScoredPost } from "../../lib/valueScore";

type FilterState = {
  meat: string;
  area: string;
  borough: string;
  tubeLine: string;
};

type FilterAction =
  | { type: "SET_FILTER"; name: keyof FilterState; value: string }
  | { type: "CLEAR_FILTERS" };

const initialFilterState: FilterState = {
  meat: "",
  area: "",
  borough: "",
  tubeLine: "",
};

const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case "SET_FILTER":
      return { ...state, [action.name]: action.value };
    case "CLEAR_FILTERS":
      return initialFilterState;
  }
};

const getInitialStateFromUrl = (): URLSearchParams | null => {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search);
};

export type ValueSortColumn = "valueScore" | "rating" | "price" | "title";

const filterScoredPosts = (scoredPosts: ValueScoredPost[], filters: FilterState): ValueScoredPost[] =>
  scoredPosts.filter(({ post }) => {
    const meat = post.meats?.nodes[0]?.name ?? "";
    const area = post.areas?.nodes[0]?.name ?? "";
    const borough = post.boroughs?.nodes[0]?.name ?? "";
    const tubeLines = post.tubeLines?.nodes.map((node) => node.name) ?? [];

    return (
      (filters.meat ? meat === filters.meat : true) &&
      (filters.area ? area === filters.area : true) &&
      (filters.borough ? borough === filters.borough : true) &&
      (filters.tubeLine ? tubeLines.includes(filters.tubeLine) : true)
    );
  });

const sortScoredPosts = (
  scoredPosts: ValueScoredPost[],
  column: ValueSortColumn,
  order: "asc" | "desc"
): ValueScoredPost[] =>
  [...scoredPosts].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (column) {
      case "rating":
        aValue = a.rating;
        bValue = b.rating;
        break;
      case "price":
        aValue = a.adjustedPrice;
        bValue = b.adjustedPrice;
        break;
      case "title":
        aValue = a.post.title ?? "";
        bValue = b.post.title ?? "";
        break;
      default:
        aValue = a.valueScore;
        bValue = b.valueScore;
    }

    if (aValue < bValue) return order === "asc" ? -1 : 1;
    if (aValue > bValue) return order === "asc" ? 1 : -1;
    return 0;
  });

export const useValueFilter = (scoredPosts: ValueScoredPost[]) => {
  const urlParams = getInitialStateFromUrl();

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    urlParams?.get("order") === "asc" ? "asc" : "desc"
  );
  const [sortColumn, setSortColumn] = useState<ValueSortColumn>(
    (urlParams?.get("sort") as ValueSortColumn) ?? "valueScore"
  );
  const [filters, dispatch] = useReducer(filterReducer, {
    meat: urlParams?.get("meat") ?? "",
    area: urlParams?.get("area") ?? "",
    borough: urlParams?.get("borough") ?? "",
    tubeLine: urlParams?.get("tubeLine") ?? "",
  });

  const handleSortChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setSortColumn(e.target.value as ValueSortColumn);
  }, []);

  const toggleSortOrder = useCallback((): void => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const handleFilterChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: "SET_FILTER", name: e.target.name as keyof FilterState, value: e.target.value });
  }, []);

  const clearFilters = useCallback((): void => {
    dispatch({ type: "CLEAR_FILTERS" });
  }, []);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (sortColumn !== "valueScore") params.set("sort", sortColumn);
    if (sortOrder !== "desc") params.set("order", sortOrder);
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [sortColumn, sortOrder, filters]);

  const copyShareableLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const sortedPosts = useMemo(
    () => sortScoredPosts(filterScoredPosts(scoredPosts, filters), sortColumn, sortOrder),
    [scoredPosts, filters, sortColumn, sortOrder]
  );

  return {
    sortOrder,
    sortColumn,
    filters,
    handleSortChange,
    toggleSortOrder,
    handleFilterChange,
    clearFilters,
    copyShareableLink,
    copied,
    sortedPosts,
  };
};
