/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import { type ChangeEvent, type SetStateAction, useEffect, useState } from "react";
import type { Post } from "../types";

const SortPosts = ({ posts }: { posts: Post[] }) => {
  const [sortOrder, setSortOrder] = useState("desc");
  const [sortColumn, setSortColumn] = useState("rating");
  const [sortedPosts, setSortedPosts] = useState([...posts]);

  const [meatFilter, setMeatFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [boroughFilter, setBoroughFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [closedDownFilter, setClosedDownFilter] = useState("");

  const [showOptions, setShowOptions] = useState(false);

  const [showYearVisited, setShowYearVisited] = useState(false);
  const [showMeat, setShowMeat] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [showTubeStation, setShowTubeStation] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [showBorough, setShowBorough] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [showClosedDown, setShowClosedDown] = useState(true);

  type BooleanStateSetter = (value: SetStateAction<boolean>) => void;

  const handleCheckboxChange = (setter: BooleanStateSetter) => () => {
    setter((prev) => !prev);
  };

  const sortedByColumn = (posts: Post[], column: string, order: string) => {
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
          if (typeof aValue === "string") {
            aValue = Number(aValue.replace(/[£,]/g, ""));
            bValue = Number(bValue.replace(/[£,]/g, ""));
          }
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

  const filterPosts = (posts: Post[]) => {
    return posts.filter((post) => {
      const rating = post.ratings?.nodes[0]?.name || 0;
      const meat = post.meats?.nodes[0]?.name || "";
      const price = post.prices?.nodes[0]?.name || "0";

      return (
        (meatFilter ? meat === meatFilter : true) &&
        (scoreFilter ? Number(rating) >= Number(scoreFilter) : true) &&
        (priceFilter ? Number(price.replace(/[£,]/g, "")) <= Number(priceFilter) : true) &&
        (areaFilter ? post.areas?.nodes[0]?.name === areaFilter : true) &&
        (boroughFilter ? post.boroughs?.nodes[0]?.name === boroughFilter : true) &&
        (ownerFilter ? post.owners?.nodes[0]?.name === ownerFilter : true) &&
        (closedDownFilter
          ? closedDownFilter === "open"
            ? !post.closedDowns?.nodes[0]?.name
            : post.closedDowns?.nodes[0]?.name === closedDownFilter
          : true)
      );
    });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omitting filterPosts function
  useEffect(() => {
    const filteredPosts = filterPosts(posts);

    setSortedPosts(sortedByColumn(filteredPosts, sortColumn, sortOrder));
  }, [
    sortColumn,
    sortOrder,
    posts,
    meatFilter,
    scoreFilter,
    priceFilter,
    areaFilter,
    boroughFilter,
    ownerFilter,
    closedDownFilter,
  ]);

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newSortColumn = e.target.value;
    setSortColumn(newSortColumn);
  };

  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);
  };

  const translateClosedDown = (closedDown: string | undefined) => {
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
          return `Re-reviewed in ${year}`;
        }
        return closedDown;
    }
  };

  const handleFilterChange = (
    e: ChangeEvent<HTMLSelectElement> | ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    if (name === "meat") setMeatFilter(value);
    if (name === "score") setScoreFilter(value);
    if (name === "price") setPriceFilter(value);
    if (name === "area") setAreaFilter(value);
    if (name === "borough") setBoroughFilter(value);
    if (name === "owner") setOwnerFilter(value);
    if (name === "closedDown") setClosedDownFilter(value);
  };

  const clearFilters = () => {
    setMeatFilter("");
    setScoreFilter("");
    setPriceFilter("");
    setAreaFilter("");
    setBoroughFilter("");
    setOwnerFilter("");
    setClosedDownFilter("");
  };

  const uniqueMeats = [...new Set(posts.map((post) => post.meats?.nodes[0]?.name).filter(Boolean))];

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
      >
        {showOptions ? "Hide options" : "Show all options"}
      </button>
      {showOptions && (
        <div>
          <div className="toggle-columns">
            <h4>Show/hide columns:</h4>
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
              <select id="meat-filter" name="meat" value={meatFilter} onChange={handleFilterChange}>
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
                value={scoreFilter}
                onChange={handleFilterChange}
              />
            </div>{" "}
            <div>
              <label htmlFor="price-filter">Filter by Price (maximum): </label>
              <input
                type="number"
                id="price-filter"
                name="price"
                value={priceFilter}
                onChange={handleFilterChange}
              />
            </div>{" "}
            <div>
              <label htmlFor="area-filter">Filter by Area: </label>
              <select id="area-filter" name="area" onChange={handleFilterChange}>
                <option value="">All</option>
                {Array.from(new Set(posts.map((post) => post.areas?.nodes[0]?.name)))
                  .filter(Boolean)
                  .map((area) => (
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
                {Array.from(new Set(posts.map((post) => post.boroughs?.nodes[0]?.name)))
                  .filter(Boolean)
                  .map((borough) => (
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
                {Array.from(new Set(posts.map((post) => post.owners?.nodes[0]?.name)))
                  .filter(Boolean)
                  .map((owner) => (
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
                {Array.from(new Set(posts.map((post) => post.closedDowns?.nodes[0]?.name)))
                  .filter(Boolean)
                  .map((closedDown) => (
                    <option key={closedDown} value={closedDown}>
                      {closedDown}
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
              >
                {post.title}
              </a>
              <span className={`${post.closedDowns?.nodes[0]?.name ? "closed-down" : ""}`}>
                {post.ratings?.nodes[0]?.name}
              </span>
              {showPrice && <span>{post.prices?.nodes[0]?.name || ""}</span>}
              {showMeat && <span>{post.meats?.nodes[0]?.name}</span>}
              {showYearVisited && <span>{post.yearsOfVisit?.nodes[0]?.name}</span>}
              {showTubeStation && <span>{post.tubeStations?.nodes[0]?.name}</span>}
              {showArea && <span>{post.areas?.nodes[0]?.name}</span>}
              {showBorough && <span>{post.boroughs?.nodes[0]?.name}</span>}
              {showOwner && <span>{post.owners?.nodes[0]?.name}</span>}
              {showClosedDown && (
                <span>{translateClosedDown(post.closedDowns?.nodes[0]?.name)}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default SortPosts;
