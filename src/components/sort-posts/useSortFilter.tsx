import { type ChangeEvent, type ReactElement, type SetStateAction, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { Post } from "../../types";

type SortColumn = "rating" | "price" | "yearVisited" | "meat" | "tubeStation" | "area" | "borough" | "owner" | "closedDown" | "title";
type SortOrder = "asc" | "desc";

type FilterState = {
  meat: string;
  score: string;
  price: string;
  area: string;
  borough: string;
  owner: string;
  closedDown: string;
  year: string;
  zone: string;
};

type FilterAction =
  | { type: "SET_FILTER"; name: keyof FilterState; value: string }
  | { type: "CLEAR_FILTERS" };

const initialFilterState: FilterState = {
  meat: "",
  score: "",
  price: "",
  area: "",
  borough: "",
  owner: "",
  closedDown: "",
  year: "",
  zone: "",
};

const isFilterKey = (key: string): key is keyof FilterState => key in initialFilterState;

const SORT_COLUMNS: readonly SortColumn[] = ["rating", "price", "yearVisited", "meat", "tubeStation", "area", "borough", "owner", "closedDown", "title"];
const SORT_ORDERS: readonly SortOrder[] = ["asc", "desc"];

const isSortColumn = (val: string): val is SortColumn => (SORT_COLUMNS as readonly string[]).includes(val);
const isSortOrder = (val: string): val is SortOrder => (SORT_ORDERS as readonly string[]).includes(val);

const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case "SET_FILTER":
      return { ...state, [action.name]: action.value };
    case "CLEAR_FILTERS":
      return initialFilterState;
  }
};

const sortedByColumn = (posts: Post[], column: SortColumn, order: SortOrder): Post[] => {
  return [...posts].sort((a, b) => {
    let aValue: string | number = "";
    let bValue: string | number = "";

    switch (column) {
      case "rating":
        aValue = a.ratings?.nodes[0]?.name ?? "";
        bValue = b.ratings?.nodes[0]?.name ?? "";
        break;

      case "price":
        aValue = a.prices?.nodes[0]?.name ?? "";
        bValue = b.prices?.nodes[0]?.name ?? "";
        aValue = Number(aValue.replace(/[£,]/g, ""));
        bValue = Number(bValue.replace(/[£,]/g, ""));
        break;

      case "yearVisited":
        aValue = a.yearsOfVisit?.nodes[0]?.name ?? "";
        bValue = b.yearsOfVisit?.nodes[0]?.name ?? "";
        break;

      case "meat":
        aValue = a.meats?.nodes[0]?.name ?? "";
        bValue = b.meats?.nodes[0]?.name ?? "";
        break;

      case "tubeStation":
        aValue = a.tubeStations?.nodes[0]?.name ?? "";
        bValue = b.tubeStations?.nodes[0]?.name ?? "";
        break;

      case "area":
        aValue = a.areas?.nodes[0]?.name ?? "";
        bValue = b.areas?.nodes[0]?.name ?? "";
        break;

      case "borough":
        aValue = a.boroughs?.nodes[0]?.name ?? "";
        bValue = b.boroughs?.nodes[0]?.name ?? "";
        break;

      case "owner":
        aValue = a.owners?.nodes[0]?.name ?? "";
        bValue = b.owners?.nodes[0]?.name ?? "";
        break;

      case "closedDown":
        aValue = a.closedDowns?.nodes[0]?.name ?? "";
        bValue = b.closedDowns?.nodes[0]?.name ?? "";
        break;

      case "title":
        aValue = a.title ?? "";
        bValue = b.title ?? "";
        break;

      default:
        aValue = "";
        bValue = "";
    }

    if (aValue < bValue) return order === "asc" ? -1 : 1;
    if (aValue > bValue) return order === "asc" ? 1 : -1;
    return 0;
  });
};

const filterPosts = (posts: Post[], filters: FilterState): Post[] => {
  return posts.filter((post) => {
    const rating = post.ratings?.nodes[0]?.name || 0;
    const meat = post.meats?.nodes[0]?.name || "";
    const price = post.prices?.nodes[0]?.name || "0";

    return (
      (filters.meat ? meat === filters.meat : true) &&
      (filters.score ? Number(rating) >= Number(filters.score) : true) &&
      (filters.price ? Number(price.replace(/[£,]/g, "")) <= Number(filters.price) : true) &&
      (filters.area ? post.areas?.nodes[0]?.name === filters.area : true) &&
      (filters.borough ? post.boroughs?.nodes[0]?.name === filters.borough : true) &&
      (filters.owner ? post.owners?.nodes[0]?.name === filters.owner : true) &&
      (filters.closedDown
        ? filters.closedDown === "open"
          ? !post.closedDowns?.nodes[0]?.name
          : post.closedDowns?.nodes[0]?.name === filters.closedDown
        : true) &&
      (filters.year ? post.yearsOfVisit?.nodes[0]?.name === filters.year : true) &&
      (filters.zone ? post.zones?.nodes.some((z) => z.name === filters.zone) : true)
    );
  });
};

export const translateClosedDown = (
  closedDown: string | undefined,
  newSlug: string | undefined
): string | ReactElement | undefined => {
  switch (closedDown) {
    case "closeddown":
      return "Closed Down";
    case "stopped":
      return "Stopped Doing Roasts";
    case "popupmoved":
      return "Popup Moved";
    case "tempclosed":
      return "Temporarily Closed";
    case "newowners":
      return "New Owners";
    case "popupstopped":
      return "Popup Stopped";
    default:
      if (closedDown?.startsWith("re-reviewed-")) {
        const year = closedDown.split("re-reviewed-")[1];
        if (newSlug) {
          return (
            <a href={`/${newSlug}`}>
              Re-reviewed in {year}
            </a>
          );
        }
        return `Re-reviewed in ${year}`;
      }
      return closedDown;
  }
};

type BooleanStateSetter = (value: SetStateAction<boolean>) => void;

const getInitialStateFromUrl = (): URLSearchParams | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params;
};

export const useSortFilter = (posts: Post[]) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const val = getInitialStateFromUrl()?.get("order") ?? "desc";
    return isSortOrder(val) ? val : "desc";
  });
  const [sortColumn, setSortColumn] = useState<SortColumn>(() => {
    const val = getInitialStateFromUrl()?.get("sort") ?? "rating";
    return isSortColumn(val) ? val : "rating";
  });
  const [filters, dispatch] = useReducer(filterReducer, undefined, () => {
    const params = getInitialStateFromUrl();
    return {
      meat: params?.get("meat") ?? "",
      score: params?.get("score") ?? "",
      price: params?.get("price") ?? "",
      area: params?.get("area") ?? "",
      borough: params?.get("borough") ?? "",
      owner: params?.get("owner") ?? "",
      closedDown: params?.get("closedDown") ?? "",
      year: params?.get("year") ?? "",
      zone: params?.get("zone") ?? "",
    };
  });
  const [showOptions, setShowOptions] = useState(false);
  const [showYearVisited, setShowYearVisited] = useState(false);
  const [showMeat, setShowMeat] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [showTubeStation, setShowTubeStation] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [showBorough, setShowBorough] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [showClosedDown, setShowClosedDown] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (sortColumn !== "rating") params.set("sort", sortColumn);
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
  const [showInflationPrice, setShowInflationPrice] = useState(false);

  const handleCheckboxChange = useCallback(
    (setter: BooleanStateSetter): (() => void) =>
      () => {
        setter((prev) => !prev);
      },
    []
  );

  const handleSortChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (isSortColumn(val)) {
      setSortColumn(val);
    }
  }, []);

  const toggleSortOrder = useCallback((): void => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const handleFilterChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement> | ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (isFilterKey(name)) {
        dispatch({ type: "SET_FILTER", name, value });
      }
    },
    []
  );

  const clearFilters = useCallback((): void => {
    dispatch({ type: "CLEAR_FILTERS" });
  }, []);

  const sortedPosts = useMemo(
    () => sortedByColumn(filterPosts(posts, filters), sortColumn, sortOrder),
    [posts, filters, sortColumn, sortOrder]
  );
  const uniqueMeats = useMemo(
    () => [...new Set(posts.map((post) => post.meats?.nodes[0]?.name).filter((name): name is string => name !== undefined))].sort(),
    [posts]
  );

  return {
    sortOrder,
    sortColumn,
    filters,
    showOptions,
    setShowOptions,
    showYearVisited,
    showMeat,
    showPrice,
    showTubeStation,
    showArea,
    showBorough,
    showOwner,
    showClosedDown,
    handleCheckboxChange,
    handleSortChange,
    toggleSortOrder,
    handleFilterChange,
    clearFilters,
    sortedPosts,
    uniqueMeats,
    setShowYearVisited,
    setShowMeat,
    setShowPrice,
    setShowTubeStation,
    setShowArea,
    setShowBorough,
    setShowOwner,
    setShowClosedDown,
    copyShareableLink,
    copied,
    showInflationPrice,
    setShowInflationPrice,
  };
};
