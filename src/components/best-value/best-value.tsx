import { useMemo } from "react";
import { computeValueScores } from "../../lib/valueScore";
import type { Post } from "../../types";
import { useValueFilter } from "./useValueFilter";

const getUniqueValues = (posts: Post[], accessor: (post: Post) => string | undefined): string[] =>
  Array.from(new Set(posts.map(accessor))).filter((v): v is string => v !== undefined && v !== "").sort();

const BestValue = ({
  posts,
  inflationIndex = {},
  mostRecentYear = "",
}: {
  posts: Post[];
  inflationIndex?: Record<string, number>;
  mostRecentYear?: string;
}) => {
  const scoredPosts = useMemo(() => computeValueScores(posts, inflationIndex), [posts, inflationIndex]);

  const {
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
  } = useValueFilter(scoredPosts);

  const uniqueMeats = useMemo(
    () => getUniqueValues(posts, (post) => post.meats?.nodes[0]?.name),
    [posts]
  );
  const uniqueAreas = useMemo(
    () => getUniqueValues(posts, (post) => post.areas?.nodes[0]?.name),
    [posts]
  );
  const uniqueBoroughs = useMemo(
    () => getUniqueValues(posts, (post) => post.boroughs?.nodes[0]?.name),
    [posts]
  );
  const uniqueTubeLines = useMemo(
    () =>
      Array.from(new Set(posts.flatMap((post) => post.tubeLines?.nodes.map((node) => node.name) ?? [])))
        .filter((v): v is string => Boolean(v))
        .sort(),
    [posts]
  );

  const maxPrice = useMemo(
    () => Math.max(1, ...scoredPosts.map((scored) => scored.adjustedPrice)),
    [scoredPosts]
  );

  return (
    <div className="best-value-container">
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
          <label htmlFor="area-filter">Filter by Area: </label>
          <select id="area-filter" name="area" value={filters.area} onChange={handleFilterChange}>
            <option value="">All</option>
            {uniqueAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="borough-filter">Filter by Borough: </label>
          <select id="borough-filter" name="borough" value={filters.borough} onChange={handleFilterChange}>
            <option value="">All</option>
            {uniqueBoroughs.map((borough) => (
              <option key={borough} value={borough}>
                {borough}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tube-line-filter">Filter by Tube Line: </label>
          <select id="tube-line-filter" name="tubeLine" value={filters.tubeLine} onChange={handleFilterChange}>
            <option value="">All</option>
            {uniqueTubeLines.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="sort-posts">
        <label htmlFor="sort-column">Sort by: </label>
        <select id="sort-column" onChange={handleSortChange} value={sortColumn}>
          <option value="valueScore">Value Score</option>
          <option value="rating">Rating</option>
          <option value="price">Price (inflation-adjusted)</option>
          <option value="title">Name</option>
        </select>
        <button type="button" onClick={toggleSortOrder}>
          {sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
        </button>
      </div>

      <button type="button" className="clear-button" onClick={clearFilters}>
        Clear All Filters
      </button>
      <button type="button" className="share-button" onClick={copyShareableLink}>
        {copied ? "Copied!" : "Copy shareable link"}
      </button>

      <p className="value-score-note">
        Value score = rating &divide; inflation-adjusted price
        {mostRecentYear ? ` (shown in ${mostRecentYear} money)` : ""}. Higher is better value.
      </p>

      <div className="value-scatter">
        <svg
          viewBox="0 0 320 220"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="value-scatter-title"
        >
          <title id="value-scatter-title">
            Scatter plot of inflation-adjusted price versus rating for every venue
          </title>
          <line x1="30" y1="10" x2="30" y2="200" className="axis-line" />
          <line x1="30" y1="200" x2="310" y2="200" className="axis-line" />
          <text x="4" y="14" className="axis-label">
            10
          </text>
          <text x="10" y="212" className="axis-label">
            0
          </text>
          <text x="270" y="216" className="axis-label">
            ~£{Math.round(maxPrice)}
          </text>
          {sortedPosts.map(({ post, adjustedPrice, rating, valueScore }) => {
            const x = 30 + (adjustedPrice / maxPrice) * 270;
            const y = 200 - (rating / 10) * 190;
            return (
              <a key={post.slug} href={`/${post.slug}`}>
                <circle cx={x} cy={y} r={3 + Math.min(6, valueScore * 2)} className="value-dot">
                  <title>
                    {post.title}: {rating}/10 for ~£{adjustedPrice.toFixed(2)} (value score{" "}
                    {valueScore.toFixed(2)})
                  </title>
                </circle>
              </a>
            );
          })}
        </svg>
      </div>

      <table className="value-table">
        <caption className="visually-hidden">Roast dinners ranked by value score</caption>
        <thead>
          <tr>
            <th scope="col">Venue</th>
            <th scope="col">Rating</th>
            <th scope="col">Price</th>
            <th scope="col">Value Score</th>
            <th scope="col">Area</th>
          </tr>
        </thead>
        <tbody>
          {sortedPosts.map(({ post, adjustedPrice, rating, valueScore }) => (
            <tr key={post.slug}>
              <td>
                <a href={`/${post.slug}`} data-test-id="value-link">
                  {post.title}
                </a>
              </td>
              <td data-test-id="value-rating">{rating}</td>
              <td data-test-id="value-price">~£{adjustedPrice.toFixed(2)}</td>
              <td data-test-id="value-score">{valueScore.toFixed(2)}</td>
              <td data-test-id="value-area">{post.areas?.nodes[0]?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BestValue;
