# Site Audit

Living checklist maintained by the `/full-audit` skill. Findings are appended, never rewritten;
check an item off (`- [x]`) once you've fixed it and it won't be touched again. Re-running the
audit adds new findings to the bottom of each section and leaves checked items alone.

## Run log

- 2026-08-31 — initial audit: 76 findings (13 test coverage, 6 a11y, 10 perf, 11 SEO, 5 responsive/UX, 9 security, 17 README alignment, 21 code quality — some categories combined closely related sub-items per-file)
- 2026-09-01 — scheduled maintenance run: resolved performance item "archive.astro missing Cache-Control header" (section 3)
- 2026-09-02 — resolved: `src/pages/api/passport/og.ts` missing `Cache-Control` header (performance, section 3)

## 1. Test coverage — unit gaps and e2e

- [ ] `src/middleware.ts` (Clerk auth gate) has 0% test coverage — add `tests/e2e/auth-protected-routes.spec.ts` verifying signed-out users are redirected/blocked from `/my-roasts`, `/my-passport`, and API routes like `/api/wishlist`, `/api/visits`, `/api/profile` (found: 2026-08-31)
- [ ] `src/pages/sign-in.astro` has 0% coverage and no e2e spec — add `tests/e2e/sign-in.spec.ts` checking the Clerk widget renders and a signed-in user is redirected away from `/sign-in` (found: 2026-08-31)
- [ ] `src/pages/my-roasts.astro` has 0% coverage — add `tests/e2e/my-roasts.spec.ts` covering an authenticated user viewing their wishlist/visits lists (mock Clerk session) (found: 2026-08-31)
- [ ] `src/components/wishlist-button/wishlist-button.tsx` (uncovered lines 54-56) has no e2e spec — add `tests/e2e/wishlist.spec.ts` for toggling wishlist state from a post page while signed in, confirming persistence on reload (found: 2026-08-31)
- [ ] `src/components/visit-button/visit-button.astro` (branch coverage only 50%) has no e2e spec — add `tests/e2e/visit-tracking.spec.ts` for marking a roast visited/unvisited from a post page while signed in (found: 2026-08-31)
- [ ] `/my-passport` and the badges/OG flow (`src/pages/api/passport/badges.ts`, `src/pages/api/passport/og.ts`) have no e2e coverage — add `tests/e2e/passport-badges.spec.ts` for a signed-in user visiting `/my-passport` and seeing badges reflecting their visited roasts (found: 2026-08-31)
- [ ] `src/components/sunday-roast-planner/sunday-roast-planner.tsx` (uncovered branches around lines 80/301/322/445) has no e2e spec — add `tests/e2e/sunday-roast-planner.spec.ts` covering picking constraints and generating a plan end-to-end (found: 2026-08-31)
- [ ] `src/components/random-pub-picker/random-pub-picker.tsx` has a unit test but no e2e spec — add `tests/e2e/random-pub-picker.spec.ts` covering clicking "pick a random pub" and landing on a valid roast (found: 2026-08-31)
- [ ] `src/pages/boroughs/[borough].astro` / `index.astro` (85-86% branch coverage) have no e2e spec — add `tests/e2e/boroughs.spec.ts` covering navigating from the boroughs index to a specific borough listing (found: 2026-08-31)
- [ ] `src/pages/chains/[chain].astro` / `index.astro` have no e2e spec — add `tests/e2e/chains.spec.ts` covering navigating the chains index to a specific chain listing page (found: 2026-08-31)
- [ ] `src/components/best-value/best-value.tsx` + `useValueFilter.tsx` (uncovered lines 96-98) have no e2e spec — add `tests/e2e/best-value.spec.ts` covering filtering the best-value list and confirming results update (found: 2026-08-31)
- [ ] `src/components/sort-posts/sort-posts.tsx` is the weakest unit-covered component (69.49% stmt, uncovered block 376-388) and its show/hide-columns + combined sort+filter+pagination interplay isn't e2e-tested — extend/add `tests/e2e/league-of-roasts-sort.spec.ts` covering sort order changes combined with an active filter (found: 2026-08-31)
- [ ] `src/pages/guessthescore/api/scores.ts` (uncovered line 17, likely an error path) — add an error-state case to `tests/e2e/guessthescore.spec.ts` for when the leaderboard fetch fails (found: 2026-08-31)
- [ ] `src/components/header/HeaderAuth.tsx` has a unit test with a mock but no e2e spec verifying real signed-in vs signed-out header states — add `tests/e2e/header-auth.spec.ts` (found: 2026-08-31)

## 2. Accessibility

- [ ] Serious axe violation "frame-title": the Bluesky embed iframe on post pages (e.g. `/ember-yard-soho`, via `src/pages/[slug].astro`) has no accessible name — give the injected `iframe[data-bluesky-id]` a `title` attribute (found: 2026-08-31)
- [ ] `/maps` has 317 individually keyboard-focusable Leaflet markers (`tabindex="0"`, `role="button"`) with no "skip past markers" mechanism, forcing keyboard/screen-reader users to tab through all of them to reach content below the map — add a skip link (found: 2026-08-31)
- [ ] Browser-tool viewport resizing did not work in this audit session (`window.innerWidth` stayed ~2560px regardless of requested width) — mobile-viewport a11y/layout (~375px) and the mobile hamburger nav's interactive open/close were not verified this run; re-check with working device emulation (found: 2026-08-31)
- [ ] `/my-passport` could not be a11y-checked — it's gated behind an off-by-default `myPassport` feature flag and Clerk auth; re-verify once flag/auth can be exercised in a test environment (found: 2026-08-31)
- [ ] `/my-roasts` could not be a11y-checked — redirects straight to hosted Clerk sign-in; re-verify with a authenticated test session (found: 2026-08-31)

## 3. Performance

- [ ] `src/pages/league-of-roasts.astro:98` and `src/pages/find-a-roast.astro:46` use `client:only="react"` for `SortPosts`/`SundayRoastPlanner`, rendering nothing until JS loads even though their data (`allRoastPosts`) is available at build time (`prerender = true`) — `league-of-roasts.astro:87-99` ships a manual CSS spinner to paper over the blank gap; consider server-rendering with client hydration instead (found: 2026-08-31)
- [ ] `src/pages/to-do-list.astro:35` uses `client:only="react"` for `RandomPubPicker`, which doesn't need `window` at import time and could render server-side with hydration instead of a blank-until-JS gap (found: 2026-08-31)
- [ ] `src/lib/api.ts:1-65` (`fetchGraphQL`) only dedupes requests via a per-invocation in-memory `Map` — identical queries are refetched from WordPress on every cold/new serverless invocation; consider backing with `@vercel/kv` (already a dependency) (found: 2026-08-31)
- [ ] `src/lib/getAllRoastDinnerPosts.ts:9-43` caches the full paginated post list only in a per-invocation module-level `Promise`, not `@vercel/kv` — the same expensive, largely-static fetch reruns across invocations (found: 2026-08-31)
- [ ] `src/pages/api/passport/badges.ts:23` calls `getAllRoastDinnerPosts()` (the entire post catalog) on every request with no caching and no `Cache-Control` header (found: 2026-08-31)
- [x] `src/pages/archive.astro:9` (`prerender = false`) calls `fetchPostsByDate` on every request with no `Cache-Control` header, unlike `annual-roastatistics.astro:14-19` which sets `s-maxage=3600, stale-while-revalidate=86400` — apply the same pattern (found: 2026-08-31) (resolved: 2026-09-01, PR #629)
- [ ] `src/pages/api/homepage-highlights.json.ts:4-10` runs four parallel GraphQL fetches on every request (called client-side from `index.astro:376-377`) with no `Cache-Control` header and no KV caching despite infrequently-changing data (found: 2026-08-31)
- [x] `src/pages/api/passport/og.ts:6-10` regenerates a `@vercel/og` image on every request with no `Cache-Control` header, so neither CDN nor browser caches it despite repeatable params (found: 2026-08-31) (resolved: 2026-09-02, PR #631)
- [ ] `src/components/featured-post-header/featured-post-header.astro:12` renders the hero image as a raw `<img loading="eager">` with no `width`/`height` (CLS risk); `astro.config.mjs` has no `image.domains`/`remotePatterns` for the WordPress media host, forcing all WP-hosted images through plain `<img>` with no AVIF/WebP conversion or responsive `srcset` — configure remote image domains (found: 2026-08-31)
- [ ] `src/components/best-posts-list/best-posts-list.astro:44-53` has correct `width`/`height`/`loading="lazy"` but still serves the raw full-size WordPress `sourceUrl` rather than a resized/optimized variant, for the same remote-image-config reason above (found: 2026-08-31)

## 4. SEO / metadata

- [ ] `astro.config.mjs`'s `sitemap()` integration (~lines 55-92) has no `filter`/`exclude` option, so noindex/private routes (`/my-passport`, `/my-roasts`, `/flags`, `/sign-in`, `/404`, `/search`, `/guessthescore`) likely still get emitted into the sitemap — add a filter (found: 2026-08-31)
- [ ] `public/robots.txt` disallows `/flags` and `/sign-in`, but both also set `noindex={true}` via BaseLayout — blocking crawl access prevents Googlebot from ever seeing the noindex tag, so de-indexing can silently fail if the URL is linked elsewhere; allow crawl and rely on noindex, or vice versa consistently (found: 2026-08-31)
- [ ] `public/robots.txt` disallows `/404.html` but the real 404 route is `/404` (`src/pages/404.astro`, no `.html`) — fix the Disallow rule to match the actual route (found: 2026-08-31)
- [ ] Root-level `./middleware.js` (bad-bot blocking logic) is not the file Astro actually loads (`src/middleware.ts` is, and only handles Clerk auth) and isn't wired into the `@astrojs/vercel` build — appears to be dead code, meaning bad bots aren't actually being blocked despite the code existing; wire it in or remove it (found: 2026-08-31)
- [ ] Every route renders a single sr-only `<h1>Roast Dinners in London</h1>` via `header.astro:18`/BaseLayout, and no route's page-specific title becomes a visible h1 — no route has a visible, page-topic-specific h1 (found: 2026-08-31)
- [ ] `src/pages/privacy-policy.astro:16` renders its own visible `<h1>Privacy Policy</h1>` in addition to the global sr-only h1, giving that route two h1 elements — remove one (found: 2026-08-31)
- [ ] Page titles are inconsistently branded — some routes append `"| Roast Dinners in London"` (`boroughs/index.astro:85`, `guessthescore/index.astro:45`) while others don't (`chains/index.astro:47`, `archive.astro:44`, `my-roasts.astro:41`); BaseLayout applies no shared title template — standardize via a shared suffix (found: 2026-08-31)
- [ ] `src/pages/my-passport.astro` (BaseLayout call ~line 60) never passes `opengraphImage`, even though a dynamic per-user OG image already exists at `src/pages/api/passport/og.ts` — wire it into the page's own `og:image` meta tag, not just the manual share-card links in `passport-share-card.astro:19` (found: 2026-08-31)

## 5. Responsive / UX

- [ ] Console warning on every page load: "Alpine Warning: Alpine has already been initialized on this page. Calling Alpine.start() more than once can cause problems" — check `src/entrypoints/alpine.ts` and its invocation sites for a double-start (found: 2026-08-31)
- [ ] `/search` page's help copy includes the example query "Trump is a paedo" — reads as a leftover joke/placeholder naming a real public figure with a defamatory claim; replace with an innocuous example before any public-facing use (found: 2026-08-31)
- [ ] True small-viewport (~375px) layout and the mobile hamburger nav's interactive behavior were not verifiable this run due to a browser-tool viewport-resize limitation — re-run a manual/device-emulated check across homepage, post page, borough/chain listing, guessthescore, and the newsletter popup for mobile overlap (found: 2026-08-31)
- [ ] One transient observation: on a single early visit to `/boroughs`, both `.header-signin-desktop` and `.header-signin-mobile` briefly rendered simultaneously before `.header-signin-mobile` correctly hid via its `@media (min-width:1024px)` rule; did not reproduce on reload — likely a dev-only HMR/hydration timing artifact, but worth a quick look at `src/components/header/HeaderAuth.tsx` if it recurs in production (found: 2026-08-31)

## 6. Security

- [ ] `src/pages/best-roast-lists.astro:80` renders `singlePage.content` via `set:html` without calling `sanitizeContent`, unlike every other CMS-content page — a compromised/malicious WP editor account could inject script/HTML that executes for all visitors; add sanitization (found: 2026-08-31)
- [ ] `src/pages/roastatistics.astro:89` has the same issue — `set:html={singlePage.content}` bypasses `sanitizeContent` — add sanitization (found: 2026-08-31)
- [ ] `src/middleware.ts:4` only lists `/api/wishlist`, `/api/profile`, and `/my-roasts` as protected prefixes; `/api/visits`, `/api/visits/[slug]`, and `/api/passport/badges` aren't covered by middleware (each handler independently checks auth so there's no current bypass, but a future new route could easily forget the manual check) — centralize the protected-route list (found: 2026-08-31)
- [ ] No Content-Security-Policy header is set in `vercel.json` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy are already present and correctly apply to all routes via the `/(.*)` catch-all) — nice-to-have for a small project, add a CSP header (found: 2026-08-31)

## 7. README / feature alignment

- [ ] README's Commands table is missing `yarn lint:errors` (`biome check --diagnostic-level=error .`) — add it (found: 2026-08-31)
- [ ] README's Commands table is missing `yarn ts-check` (`astro check`) — add it (found: 2026-08-31)
- [ ] README's Commands table is missing `yarn knip` — add it (found: 2026-08-31)
- [ ] README's Tech stack section doesn't mention `@vercel/kv` despite it being a dependency used for guessthescore leaderboard/rate-limiting — add it (found: 2026-08-31)
- [ ] README's Tech stack section doesn't mention `leaflet`/`@types/leaflet` despite `src/pages/maps.astro` and the README's own intro mentioning "maps" — add it (found: 2026-08-31)
- [ ] README's Tech stack section doesn't mention `@astrojs/partytown` (third-party script offloading) — add it (found: 2026-08-31)
- [ ] README's Tech stack section doesn't mention `@astrojs/mdx` — add it (found: 2026-08-31)
- [ ] README's Tech stack section doesn't mention `sanitize-html` — add it (found: 2026-08-31)
- [ ] README's Tech stack section doesn't mention `accented` (a11y highlighter dependency) — add it (found: 2026-08-31)
- [ ] README's Tech stack section doesn't mention `astro-seo` — add it (found: 2026-08-31)
- [ ] `src/pages/guessthescore/` implements a full "Guess the Score" game feature with no mention anywhere in the README — add a feature line (found: 2026-08-31)
- [ ] `src/pages/my-passport.astro` + passport/badges API routes implement a full passport/badges feature (with OG image generation) not mentioned in the README — add a feature line (found: 2026-08-31)
- [ ] `src/pages/api/wishlist.ts` / `[slug].ts` implement a wishlist feature not mentioned in the README — add a feature line (found: 2026-08-31)
- [ ] `src/pages/my-roasts.astro` + visits API routes implement a "my roasts"/visit-tracking feature not mentioned in the README — add a feature line (found: 2026-08-31)
- [ ] README has no "Features" section at all — only intro + commands + tech stack — despite a large surface of live discovery/ranking/stats pages (search, find-a-roast, maps, league-of-roasts, roastatistics, boroughs, chains); add a brief features overview (found: 2026-08-31)
- [ ] `src/pages/to-do-list.astro` exists as a live route with no README mention — clarify whether it's user-facing or an internal planning page, and document or remove accordingly (found: 2026-08-31)
- [ ] `src/pages/flags.astro` (feature-flag admin/debug page) exists as a live route with no README mention — document its purpose or restrict/remove if unintended to be public (found: 2026-08-31)

## 8. Code quality

- [ ] `src/lib/valueScore.ts:11-17`, `src/lib/badges.ts:41-47`, `src/lib/inflationIndex.ts:22-24`, and `sunday-roast-planner.tsx:28-31` each reimplement "extract price from a `£x.xx` string" — extract a single shared `parsePrice` helper (found: 2026-08-31)
- [ ] `src/lib/badges.ts:39` redefines `getPostRating` almost identically to the one already exported from `src/lib/utils.ts:10` — import and reuse instead of redefining (found: 2026-08-31)
- [ ] `src/components/search/search.astro:87-101` (`getScoreColor`) and `src/components/roast-map/roast-map.tsx:24-36` (`getMarkerColor`) contain byte-for-byte identical rating-to-colour threshold tables — extract one shared helper (found: 2026-08-31)
- [ ] `src/pages/api/wishlist.ts:47` and `src/pages/api/visits.ts:44` cast `await context.request.json()` directly `as WishlistPostBody`/`as VisitsPostBody` with no runtime validation of the request body — add validation (found: 2026-08-31)
- [ ] `src/lib/homepage-highlights.ts:56,150,152` uses `array.sort(() => Math.random() - 0.5)` to shuffle — this is a biased shuffle, not a uniform permutation; replace with a Fisher-Yates shuffle (found: 2026-08-31)
- [ ] `src/components/add-comment/add-comment.astro:79,82` sets `messageElement.style.color = "red"/"green"` directly from inline script instead of toggling a CSS class, inconsistent with the project's per-component-CSS convention — refactor to a class toggle (found: 2026-08-31)
- [ ] `src/components/dropdown/dropdown.astro` has no CSS file and uses three inline `style` attributes (lines 46, 52, 59) for static/conditional styling — move to a component CSS file (found: 2026-08-31)
- [ ] `src/components/comment/comment.astro`'s reply form is shown/hidden via directly toggling `formContainer.style.display` (lines 77, 118-119) instead of a CSS class, and the component has no CSS file — refactor (found: 2026-08-31)
- [ ] `astro.config.mjs.bak` and `vitest.config.ts.bak` at the repo root are stale (predate the Clerk integration) — safe to delete (found: 2026-08-31)
- [ ] `knip.json`'s `ignoreBinaries: ["wait-on", "axe"]` is flagged by `yarn knip` itself as a removable configuration hint — clean it up (found: 2026-08-31)
