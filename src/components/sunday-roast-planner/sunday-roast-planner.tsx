import { useAuth } from "@clerk/astro/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Post } from "../../types";
import WishlistButton from "../wishlist-button/wishlist-button.tsx";
import "./sunday-roast-planner.css";

type Step = 1 | 2 | 3 | "results";
type LocationType = "area" | "borough" | "tubeLine";

const BUDGET_OPTIONS = [
  { value: "", label: "No preference" },
  { value: "20", label: "Up to £20" },
  { value: "25", label: "Up to £25" },
  { value: "30", label: "Up to £30" },
];

const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "5", label: "5 or above" },
  { value: "6", label: "6 or above" },
  { value: "7", label: "7 or above" },
  { value: "8", label: "8 or above" },
];

const getAdjustedPrice = (post: Post, inflationIndex: Record<string, number>): number | null => {
  const year = post.yearsOfVisit?.nodes[0]?.name ?? "";
  const priceStr = post.prices?.nodes[0]?.name ?? "";
  const match = priceStr.match(/[\d,.]+/);
  if (!match) return null;
  const raw = Number.parseFloat(match[0].replace(",", ""));
  if (Number.isNaN(raw) || raw <= 0) return null;
  const multiplier = year ? (inflationIndex[year] ?? 1) : 1;
  return raw * multiplier;
};

const SundayRoastPlanner = ({
  posts,
  inflationIndex = {},
  mostRecentYear = "",
}: {
  posts: Post[];
  inflationIndex?: Record<string, number>;
  mostRecentYear?: string;
}) => {
  const { isSignedIn, isLoaded } = useAuth();
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>(1);
  const [announcement, setAnnouncement] = useState("");
  const isFirstRender = useRef(true);
  const [locationType, setLocationType] = useState<LocationType>("area");
  const [area, setArea] = useState("");
  const [borough, setBorough] = useState("");
  const [tubeLine, setTubeLine] = useState("");
  const [budget, setBudget] = useState("");
  const [minRating, setMinRating] = useState("");
  const [copied, setCopied] = useState(false);

  const openPosts = useMemo(
    () => posts.filter((p) => !p.closedDowns?.nodes[0]?.name),
    [posts]
  );

  const uniqueAreas = useMemo(
    () =>
      Array.from(new Set(openPosts.map((p) => p.areas?.nodes[0]?.name).filter((a): a is string => Boolean(a))))
        .filter((a) => a !== "Not Really London")
        .sort(),
    [openPosts]
  );

  const uniqueBoroughs = useMemo(
    () =>
      Array.from(new Set(openPosts.map((p) => p.boroughs?.nodes[0]?.name).filter((a): a is string => Boolean(a)))).sort(),
    [openPosts]
  );

  const uniqueTubeLines = useMemo(
    () =>
      Array.from(new Set(openPosts.map((p) => p.tubeLines?.nodes[0]?.name).filter((a): a is string => Boolean(a)))).sort(),
    [openPosts]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get("area") ?? "";
    const bo = params.get("borough") ?? "";
    const tl = params.get("tubeLine") ?? "";
    const b = params.get("budget") ?? "";
    const r = params.get("rating") ?? "";
    if (a || bo || tl || b || r) {
      if (bo) {
        setLocationType("borough");
        setBorough(bo);
      } else if (tl) {
        setLocationType("tubeLine");
        setTubeLine(tl);
      } else {
        setLocationType("area");
        setArea(a);
      }
      setBudget(b);
      setMinRating(r);
      setStep("results");
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((items: { postSlug: string }[]) => {
        setSavedSlugs(new Set(items.map((i) => i.postSlug)));
      })
      .catch(() => {});
  }, [isLoaded, isSignedIn]);

  const results = useMemo(() => {
    if (step !== "results") return [];
    return openPosts
      .filter((p) => {
        if (locationType === "borough") return !borough || p.boroughs?.nodes[0]?.name === borough;
        if (locationType === "tubeLine") return !tubeLine || p.tubeLines?.nodes[0]?.name === tubeLine;
        return !area || p.areas?.nodes[0]?.name === area;
      })
      .filter((p) => {
        if (!budget) return true;
        const adjusted = getAdjustedPrice(p, inflationIndex);
        if (adjusted === null) return true;
        return adjusted <= Number(budget);
      })
      .filter((p) => {
        if (!minRating) return true;
        return Number(p.ratings?.nodes[0]?.name ?? 0) >= Number(minRating);
      })
      .sort(
        (a, b) =>
          Number(b.ratings?.nodes[0]?.name ?? 0) - Number(a.ratings?.nodes[0]?.name ?? 0)
      )
      .slice(0, 3);
  }, [step, openPosts, locationType, area, borough, tubeLine, budget, minRating, inflationIndex]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (step === 1) setAnnouncement("Step 1 of 3: Where do you want to eat?");
    else if (step === 2) setAnnouncement("Step 2 of 3: What's your budget?");
    else if (step === 3) setAnnouncement("Step 3 of 3: What's the minimum rating you'll accept?");
    else if (step === "results") {
      setAnnouncement(
        results.length === 0
          ? "No matching roasts found. Try relaxing your filters."
          : `${results.length === 1 ? "Your top pick is" : `Your top ${results.length} picks are`} ready.`
      );
    }
  }, [step, results]);

  const updateUrl = useCallback((lt: LocationType, a: string, bo: string, tl: string, b: string, r: string) => {
    const params = new URLSearchParams();
    if (lt === "borough" && bo) params.set("borough", bo);
    else if (lt === "tubeLine" && tl) params.set("tubeLine", tl);
    else if (a) params.set("area", a);
    if (b) params.set("budget", b);
    if (r) params.set("rating", r);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, []);

  function showResults(): void {
    updateUrl(locationType, area, borough, tubeLine, budget, minRating);
    setStep("results");
  }

  function reset(): void {
    setLocationType("area");
    setArea("");
    setBorough("");
    setTubeLine("");
    setBudget("");
    setMinRating("");
    setStep(1);
    window.history.replaceState(null, "", window.location.pathname);
  }

  function copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSaveToggle(slug: string, nowSaved: boolean): void {
    setSavedSlugs((prev) => {
      const next = new Set(prev);
      if (nowSaved) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }

  function switchLocationType(lt: LocationType): void {
    setLocationType(lt);
    setArea("");
    setBorough("");
    setTubeLine("");
  }

  const locationLabel = locationType === "borough"
    ? (borough || "no preference")
    : (area || "no preference");

  return (
    <div className="planner">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      {step === 1 && (
        <div className="planner__step">
          <p className="planner__step-label">Step 1 of 3</p>
          <h2 className="planner__step-heading">Where do you want to eat?</h2>
          <div className="planner__location-tabs">
            <button
              type="button"
              className={`planner__tab ${locationType === "area" ? "planner__tab--active" : ""}`}
              aria-pressed={locationType === "area"}
              onClick={() => switchLocationType("area")}
            >
              By area
            </button>
            <button
              type="button"
              className={`planner__tab ${locationType === "borough" ? "planner__tab--active" : ""}`}
              aria-pressed={locationType === "borough"}
              onClick={() => switchLocationType("borough")}
            >
              By borough
            </button>
            <button
              type="button"
              className={`planner__tab ${locationType === "tubeLine" ? "planner__tab--active" : ""}`}
              aria-pressed={locationType === "tubeLine"}
              onClick={() => switchLocationType("tubeLine")}
            >
              By tube line
            </button>
          </div>
          {locationType === "area" && (
            <div className="planner__options">
              <button
                type="button"
                className={`planner__option ${area === "" ? "planner__option--selected" : ""}`}
                onClick={() => setArea("")}
              >
                No preference
              </button>
              {uniqueAreas.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`planner__option ${area === a ? "planner__option--selected" : ""}`}
                  onClick={() => setArea(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
          {locationType === "borough" && (
            <div className="planner__options">
              <button
                type="button"
                className={`planner__option ${borough === "" ? "planner__option--selected" : ""}`}
                onClick={() => setBorough("")}
              >
                No preference
              </button>
              {uniqueBoroughs.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`planner__option ${borough === b ? "planner__option--selected" : ""}`}
                  onClick={() => setBorough(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
          {locationType === "tubeLine" && (
            <div className="planner__options">
              <button
                type="button"
                className={`planner__option ${tubeLine === "" ? "planner__option--selected" : ""}`}
                onClick={() => setTubeLine("")}
              >
                No preference
              </button>
              {uniqueTubeLines.map((tl) => (
                <button
                  key={tl}
                  type="button"
                  className={`planner__option ${tubeLine === tl ? "planner__option--selected" : ""}`}
                  onClick={() => setTubeLine(tl)}
                >
                  {tl}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="planner__next"
            onClick={() => setStep(2)}
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="planner__step">
          <p className="planner__step-label">Step 2 of 3</p>
          <h2 className="planner__step-heading">What's your budget?</h2>
          {mostRecentYear && (
            <p className="planner__step-note">Prices are adjusted for inflation to {mostRecentYear} equivalents.</p>
          )}
          <div className="planner__options">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`planner__option ${budget === opt.value ? "planner__option--selected" : ""}`}
                onClick={() => setBudget(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="planner__nav">
            <button type="button" className="planner__back" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              className="planner__next"
              onClick={() => setStep(3)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="planner__step">
          <p className="planner__step-label">Step 3 of 3</p>
          <h2 className="planner__step-heading">What's the minimum rating you'll accept?</h2>
          <div className="planner__options">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`planner__option ${minRating === opt.value ? "planner__option--selected" : ""}`}
                onClick={() => setMinRating(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="planner__nav">
            <button type="button" className="planner__back" onClick={() => setStep(2)}>
              Back
            </button>
            <button
              type="button"
              className="planner__next"
              onClick={showResults}
            >
              Find my roast
            </button>
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="planner__results">
          {results.length === 0 ? (
            <div className="planner__no-results">
              <p>No matching roasts found — try relaxing your filters.</p>
              <button type="button" className="planner__back" onClick={reset}>
                Try again
              </button>
            </div>
          ) : (
            <>
              <h2 className="planner__results-heading">
                {results.length === 1 ? "Your top pick" : `Your top ${results.length} picks`}
              </h2>
              <ol className="planner__result-list">
                {results.map((post) => (
                  <li key={post.slug} className="planner__result-card">
                    <div className="planner__result-main">
                      <a href={`/${post.slug}`} className="planner__result-title">
                        {post.title}
                      </a>
                      <div className="planner__result-meta">
                        {post.ratings?.nodes[0]?.name && (
                          <span className="planner__result-rating">
                            {post.ratings.nodes[0].name}/10
                          </span>
                        )}
                        {(() => {
                          const adjusted = getAdjustedPrice(post, inflationIndex);
                          const raw = post.prices?.nodes[0]?.name;
                          if (!raw) return null;
                          if (adjusted !== null && mostRecentYear) {
                            return (
                              <span className="planner__result-price" title={`Originally ${raw}; estimated ${mostRecentYear} price`}>
                                ~£{adjusted.toFixed(2)}
                              </span>
                            );
                          }
                          return <span className="planner__result-price">{raw}</span>;
                        })()}
                        {post.boroughs?.nodes[0]?.name && (
                          <span className="planner__result-area">
                            {post.boroughs.nodes[0].name}
                          </span>
                        )}
                      </div>
                    </div>
                    <WishlistButton
                      postSlug={post.slug ?? ""}
                      postTitle={post.title ?? ""}
                      postRating={post.ratings?.nodes[0]?.name}
                      isSaved={savedSlugs.has(post.slug ?? "")}
                      onSaveToggle={handleSaveToggle}
                    />
                  </li>
                ))}
              </ol>
              <div className="planner__result-actions">
                <button type="button" className="planner__back" onClick={reset}>
                  Try again with different criteria
                </button>
                <button type="button" className="planner__share" onClick={copyLink}>
                  {copied ? "Copied!" : "Copy shareable link"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SundayRoastPlanner;
