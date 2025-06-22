import { useState, useEffect, type ChangeEvent, type SetStateAction } from "react";
import type { Post } from "../types";

const SortPosts = ({ posts }: { posts: Post[] }) => {
  console.log(10, posts);
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortColumn, setSortColumn] = useState("ratings");
  const [sortedPosts, setSortedPosts] = useState([...posts]);

  const [meatFilter, setMeatFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");

  const [showYearVisited, setShowYearVisited] = useState(true);
  const [showCountry, setShowCountry] = useState(true);
  const [showMeat, setShowMeat] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  const handleCheckboxChange =
    (setter: {
      (value: SetStateAction<boolean>): void;
      (value: SetStateAction<boolean>): void;
      (value: SetStateAction<boolean>): void;
      (value: SetStateAction<boolean>): void;
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      (arg0: (prev: any) => boolean): void;
    }) =>
    () => {
      setter((prev) => !prev);
    };

  const sortedByColumn = (posts: Post[], column: string, order: string) => {
    return [...posts].sort((a, b) => {
      console.log(30, a, b, column, order);
      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (column) {
        case "ratings":
        case "rating":
          aValue = a.ratings?.nodes[0]?.name ?? "";
          bValue = b.ratings?.nodes[0]?.name ?? "";
          break;

        case "yearVisited":
          aValue = a.yearsOfVisit?.nodes[0]?.name ?? "";
          bValue = b.yearsOfVisit?.nodes[0]?.name ?? "";
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

  const filterPosts = (posts: Post[]) => {
    return posts.filter((post) => {
      // const { meat, country, rating, convertedPrice } = post.customfields;
      const rating = post.ratings?.nodes[0]?.name || 0;

      return (
        // (meatFilter ? meat === meatFilter : true) &&
        // (countryFilter ? country === countryFilter : true) &&
        scoreFilter ? rating >= scoreFilter : true
        // (priceFilter ? convertedPrice <= priceFilter : true)
      );
    });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const filteredPosts = filterPosts(posts);
    console.log(50, filteredPosts);
    setSortedPosts(sortedByColumn(filteredPosts, sortColumn, sortOrder));
  }, [sortColumn, sortOrder, posts]);

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newSortColumn = e.target.value;
    setSortColumn(newSortColumn);
  };

  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);
  };

  const handleFilterChange = (
    e: ChangeEvent<HTMLSelectElement> | ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    if (name === "meat") setMeatFilter(value);
    if (name === "country") setCountryFilter(value);
    if (name === "score") setScoreFilter(value);
    if (name === "price") setPriceFilter(value);
  };

  const clearFilters = () => {
    setMeatFilter("");
    setCountryFilter("");
    setScoreFilter("");
    setPriceFilter("");
  };

  // const uniqueMeats = [...new Set(posts.map((post) => post.customfields.meat))];

  return (
    <div>
      <div className="toggle-columns">
        <p>Show/hide columns:</p>
        <input
          type="checkbox"
          id="price"
          checked={showPrice}
          onChange={handleCheckboxChange(setShowPrice)}
        />
        <label htmlFor="price">Price</label>
        <input
          type="checkbox"
          id="meat"
          checked={showMeat}
          onChange={handleCheckboxChange(setShowMeat)}
        />
        <label htmlFor="meat">Meat</label>
        <input
          type="checkbox"
          id="country"
          checked={showCountry}
          onChange={handleCheckboxChange(setShowCountry)}
        />
        <label htmlFor="country">Country</label>
        <input
          type="checkbox"
          id="yearVisited"
          checked={showYearVisited}
          onChange={handleCheckboxChange(setShowYearVisited)}
        />
        <label htmlFor="yearVisited">Year Visited</label>
      </div>

      <div className="sort-posts">
        <label htmlFor="sort-column">Sort by: </label>
        <select id="sort-column" onChange={handleSortChange} value={sortColumn}>
          <option value="rating">Rating</option>
          <option value="convertedPrice">Price (GBP)</option>
          <option value="meat">Meat</option>
          <option value="country">Country</option>
          <option value="yearVisited">Year Visited</option>
        </select>
        <button type="button" onClick={toggleSortOrder}>
          {sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
        </button>
      </div>

      <div className="filter-posts">
        <label htmlFor="meat-filter">Filter by Meat: </label>
        <select id="meat-filter" name="meat" value={meatFilter} onChange={handleFilterChange}>
          <option value="">All</option>
          {/* {uniqueMeats.map((meat: string) => (
            <option key={meat} value={meat}>
              {meat}
            </option>
          ))} */}
        </select>

        <label htmlFor="score-filter">Filter by Rating (minimum): </label>
        <input
          type="number"
          id="score-filter"
          name="score"
          value={scoreFilter}
          onChange={handleFilterChange}
        />

        <label htmlFor="price-filter">Filter by Price (maximum): </label>
        <input
          type="number"
          id="price-filter"
          name="price"
          value={priceFilter}
          onChange={handleFilterChange}
        />
      </div>

      <button type="button" className="clear-button" onClick={clearFilters}>
        Clear All Filters
      </button>

      <ol className="grid-container league-of-roasts">
        {sortedPosts.map((post) => {
          // const { rating, currency, price, meat, country, yearVisited, convertedPrice } =
          //   post.customfields;
          return (
            <li className="grid-item" key={post.slug}>
              <a href={post.slug} target="_blank" rel="noopener noreferrer">
                {post.title}
              </a>
              <span>{post.ratings?.nodes[0]?.name}</span>
              {showPrice && <span>{post.prices?.nodes[0]?.name || ""}</span>}
              {/* {showMeat && <span>{meat}</span>} */}
              {showYearVisited && <span>{post.yearsOfVisit?.nodes[0]?.name}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default SortPosts;
