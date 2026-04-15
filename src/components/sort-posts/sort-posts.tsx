/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import { useMemo } from "react";
import type { Post } from "../../types";
import { translateClosedDown, useSortFilter } from "./useSortFilter.tsx";

const getUniqueValues = (posts: Post[], accessor: (post: Post) => string | undefined): string[] =>
  Array.from(new Set(posts.map(accessor))).filter((v): v is string => v !== undefined && v !== "");

const SortPosts = ({ posts }: { posts: Post[] }) => {
  const {
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
  } = useSortFilter(posts);

  const uniqueAreas = useMemo(
    () => getUniqueValues(posts, (post) => post.areas?.nodes[0]?.name),
    [posts]
  );
  const uniqueBoroughs = useMemo(
    () => getUniqueValues(posts, (post) => post.boroughs?.nodes[0]?.name),
    [posts]
  );
  const uniqueOwners = useMemo(
    () => getUniqueValues(posts, (post) => post.owners?.nodes[0]?.name),
    [posts]
  );
  const uniqueClosedDowns = useMemo(
    () => getUniqueValues(posts, (post) => post.closedDowns?.nodes[0]?.name),
    [posts]
  );
  const uniqueYears = useMemo(
    () => getUniqueValues(posts, (post) => post.yearsOfVisit?.nodes[0]?.name),
    [posts]
  );

  return (
    <div>
      <p>
        The league table is fully customisable, you can filter, sort and show extra data. Click to
        show all options.
      </p>
      <button
        type="button"
        className="show-hide-button"
        onClick={() => setShowOptions((prev) => !prev)}
        aria-expanded={showOptions}
      >
        {showOptions ? "Hide options" : "Show all options / filters"}
      </button>
      {showOptions && (
        <div>
          <div className="toggle-columns">
            <h3>Show/hide columns:</h3>
            <div>
              <input
                type="checkbox"
                id="price"
                checked={showPrice}
                onChange={handleCheckboxChange(setShowPrice)}
              />
              <label htmlFor="price">Price</label>
            </div>

            <div>
              <input
                type="checkbox"
                id="meat"
                checked={showMeat}
                onChange={handleCheckboxChange(setShowMeat)}
              />
              <label htmlFor="meat">Meat</label>
            </div>

            <div>
              <input
                type="checkbox"
                id="yearVisited"
                checked={showYearVisited}
                onChange={handleCheckboxChange(setShowYearVisited)}
              />
              <label htmlFor="yearVisited">Year Visited</label>
            </div>

            <div>
              <input
                type="checkbox"
                id="tubeStation"
                checked={showTubeStation}
                onChange={handleCheckboxChange(setShowTubeStation)}
              />
              <label htmlFor="tubeStation">Tube Station</label>
            </div>

            <div>
              <input
                type="checkbox"
                id="area"
                checked={showArea}
                onChange={handleCheckboxChange(setShowArea)}
              />
              <label htmlFor="area">Area</label>
            </div>

            <div>
              <input
                type="checkbox"
                id="borough"
                checked={showBorough}
                onChange={handleCheckboxChange(setShowBorough)}
              />
              <label htmlFor="borough">Borough</label>
            </div>

            <div>
              <input
                type="checkbox"
                id="owner"
                checked={showOwner}
                onChange={handleCheckboxChange(setShowOwner)}
              />
              <label htmlFor="owner">Owner</label>
            </div>

            <div>
              <input
                type="checkbox"
                id="closeddown"
                checked={showClosedDown}
                onChange={handleCheckboxChange(setShowClosedDown)}
              />
              <label htmlFor="closeddown">Closed Down</label>
            </div>
          </div>

          <div className="sort-posts">
            <label htmlFor="sort-column">Sort by: </label>
            <select id="sort-column" onChange={handleSortChange} value={sortColumn}>
              <option value="rating">Rating</option>
              <option value="price">Price (GBP)</option>
              <option value="meat">Meat</option>
              <option value="yearVisited">Year Visited</option>
              <option value="tubeStation">Tube Station</option>
              <option value="area">Area</option>
              <option value="borough">Borough</option>
              <option value="owner">Owner</option>
              <option value="title">Title</option>
            </select>
            <button type="button" onClick={toggleSortOrder}>
              {sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
            </button>
          </div>

          <div className="filter-posts">
            <div>
              <label htmlFor="meat-filter">Filter by Meat: </label>
              <select id="meat-filter" name="meat" value={filters.meat} onChange={handleFilterChange}>
                <option value="">All</option>
                {uniqueMeats.map((meat) => (
                  <option key={meat} value={meat}>
                    {meat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="score-filter">Filter by Rating (minimum): </label>
              <input
                type="number"
                id="score-filter"
                name="score"
                value={filters.score}
                onChange={handleFilterChange}
              />
            </div>{" "}
            <div>
              <label htmlFor="price-filter">Filter by Price (maximum): </label>
              <input
                type="number"
                id="price-filter"
                name="price"
                value={filters.price}
                onChange={handleFilterChange}
              />
            </div>{" "}
            <div>
              <label htmlFor="area-filter">Filter by Area: </label>
              <select id="area-filter" name="area" onChange={handleFilterChange}>
                <option value="">All</option>
                {uniqueAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>{" "}
            <div>
              <label htmlFor="borough-filter">Filter by Borough: </label>
              <select id="borough-filter" name="borough" onChange={handleFilterChange}>
                <option value="">All</option>
                {uniqueBoroughs.map((borough) => (
                  <option key={borough} value={borough}>
                    {borough}
                  </option>
                ))}
              </select>
            </div>{" "}
            <div>
              <label htmlFor="owner-filter">Filter by Owner: </label>
              <select id="owner-filter" name="owner" onChange={handleFilterChange}>
                <option value="">All</option>
                {uniqueOwners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>{" "}
            <div>
              <label htmlFor="closed-down-filter">Filter by Closed Down: </label>
              <select id="closed-down-filter" name="closedDown" onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="open">Open</option>
                {uniqueClosedDowns.map((closedDown) => (
                  <option key={closedDown} value={closedDown}>
                    {closedDown}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year-filter">Filter by Year: </label>
              <select id="year-filter" name="year" onChange={handleFilterChange}>
                <option value="">All</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="button" className="clear-button" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
      )}

      <ol className="grid-container league-of-roasts">
        {sortedPosts.map((post) => {
          return (
            <li className="grid-item" key={post.slug}>
              <a
                href={`/${post.slug}`}
                className={`${post.closedDowns?.nodes[0]?.name ? "closed-down" : ""}`}
                data-test-id="roast-link"
              >
                {post.title}
              </a>
              <span
                className={`${post.closedDowns?.nodes[0]?.name ? "closed-down" : ""}`}
                data-test-id="roast-rating"
              >
                {post.ratings?.nodes[0]?.name}
              </span>
              {showPrice && <span data-test-id="roast-price">{post.prices?.nodes[0]?.name || ""}</span>}
              {showMeat && <span data-test-id="roast-meat">{post.meats?.nodes[0]?.name}</span>}
              {showYearVisited && (
                <span data-test-id="roast-year">{post.yearsOfVisit?.nodes[0]?.name}</span>
              )}
              {showTubeStation && (
                <span data-test-id="roast-tube">{post.tubeStations?.nodes[0]?.name}</span>
              )}
              {showArea && <span data-test-id="roast-area">{post.areas?.nodes[0]?.name}</span>}
              {showBorough && (
                <span data-test-id="roast-borough">{post.boroughs?.nodes[0]?.name}</span>
              )}
              {showOwner && <span data-test-id="roast-owner">{post.owners?.nodes[0]?.name}</span>}
              {showClosedDown && (
                <span data-test-id="roast-status">
                  {translateClosedDown(post.closedDowns?.nodes[0]?.name, post.newSlugs?.nodes[0]?.name)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default SortPosts;
