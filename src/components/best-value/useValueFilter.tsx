import { type ChangeEvent, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { ValueScoredPost } from "../../lib/valueScore";

type FilterState = {
  area: string;
  borough: string;
  tubeLine: string;
};

type FilterAction =
  | { type: "SET_FILTER"; name: keyof FilterState; value: string }
  | { type: "CLEAR_FILTERS" };

const initialFilterState: FilterState = {
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

const filterScoredPosts = (scoredPosts: ValueScoredPost[], filters: FilterState): ValueScoredPost[] =>
  scoredPosts.filter(({ post }) => {
    const area = post.areas?.nodes[0]?.name ?? "";
    const borough = post.boroughs?.nodes[0]?.name ?? "";
    const tubeLines = post.tubeLines?.nodes.map((node) => node.name) ?? [];

    return (
      (filters.area ? area === filters.area : true) &&
      (filters.borough ? borough === filters.borough : true) &&
      (filters.tubeLine ? tubeLines.includes(filters.tubeLine) : true)
    );
  });

const sortByValueScoreDesc = (scoredPosts: ValueScoredPost[]): ValueScoredPost[] =>
  [...scoredPosts].sort((a, b) => b.valueScore - a.valueScore);

export const useValueFilter = (scoredPosts: ValueScoredPost[]) => {
  const urlParams = getInitialStateFromUrl();

  const [filters, dispatch] = useReducer(filterReducer, {
    area: urlParams?.get("area") ?? "",
    borough: urlParams?.get("borough") ?? "",
    tubeLine: urlParams?.get("tubeLine") ?? "",
  });

  const handleFilterChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: "SET_FILTER", name: e.target.name as keyof FilterState, value: e.target.value });
  }, []);

  const clearFilters = useCallback((): void => {
    dispatch({ type: "CLEAR_FILTERS" });
  }, []);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [filters]);

  const copyShareableLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const sortedPosts = useMemo(
    () => sortByValueScoreDesc(filterScoredPosts(scoredPosts, filters)),
    [scoredPosts, filters]
  );

  return {
    filters,
    handleFilterChange,
    clearFilters,
    copyShareableLink,
    copied,
    sortedPosts,
  };
};
