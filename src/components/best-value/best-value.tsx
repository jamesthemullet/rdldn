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
    filters,
    showOptions,
    setShowOptions,
    handleFilterChange,
    clearFilters,
    copyShareableLink,
    copied,
    sortedPosts,
  } = useValueFilter(scoredPosts);

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

  return (
    <div className="best-value-container">
      <p>
        The value rankings are fully customisable, you can filter by area, borough or tube line. Click
        to show all options.
      </p>
      <button
        type="button"
        className="show-hide-button"
        onClick={() => setShowOptions((prev) => !prev)}
        aria-expanded={showOptions}
        aria-controls="value-options-panel"
      >
        {showOptions ? "Hide options" : "Show all options / filters"}
      </button>
      {showOptions && (
        <div id="value-options-panel">
          <div className="filter-posts">
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
              <select
                id="borough-filter"
                name="borough"
                value={filters.borough}
                onChange={handleFilterChange}
              >
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
              <select
                id="tube-line-filter"
                name="tubeLine"
                value={filters.tubeLine}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {uniqueTubeLines.map((line) => (
                  <option key={line} value={line}>
                    {line}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="button" className="clear-button" onClick={clearFilters}>
            Clear All Filters
          </button>
          <button type="button" className="share-button" onClick={copyShareableLink}>
            {copied ? "Copied!" : "Copy shareable link"}
          </button>
        </div>
      )}

      <p className="value-score-note">
        Value score = rating &divide; inflation-adjusted price
        {mostRecentYear ? ` (shown in ${mostRecentYear} money)` : ""}. Higher is better value.
      </p>

      <table className="value-table">
        <caption className="visually-hidden">Roast dinners ranked by value score</caption>
        <thead>
          <tr>
            <th scope="col">Venue</th>
            <th scope="col">Rating</th>
            <th scope="col">Adjusted Price</th>
            <th scope="col">Value Score</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BestValue;
