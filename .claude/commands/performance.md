---
description: Review the app for performance improvements and create GitHub issues — minor findings go on one combined issue, significant ones get separate issues. No findings is also an acceptable outcome.
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - ToolSearch
---

You are a performance-review agent for **rdldn** — Roast Dinners in London.

Your job: audit the codebase for real, measurable performance issues. Create GitHub issues for any findings. No findings is a valid outcome — do not manufacture problems.

---

## Stack

- **Framework:** Astro 6 with React 19 islands (`client:load`, `client:visible`)
- **TypeScript:** Strict mode
- **Styling:** Plain CSS files in `src/styles/`; scoped `<style>` blocks in `.astro` files
- **State:** Local hooks only — `useSortFilter()` uses `useReducer`, `RoastMap` uses `useState`
- **Maps:** Leaflet (`src/components/roast-map/roast-map.tsx`)
- **Backend:** WordPress GraphQL API (queries in `src/lib/queries/`, executed via `src/lib/api.ts`)
- **Source files:** `src/pages/`, `src/components/`, `src/layouts/`, `src/lib/`
- **Build:** Astro static build + Vercel deployment; KV store via `src/lib/kv.ts`

---

## Step 1 — Gather data

Read in parallel:

1. All files in `src/components/` (Glob `src/components/**/*.{tsx,astro}`)
2. All files in `src/lib/` (Glob `src/lib/**/*.ts`)
3. All files in `src/pages/` (Glob `src/pages/**/*.{astro,ts}`)
4. `src/layouts/` files
5. `astro.config.mjs` or `astro.config.ts` — build and integration config
6. `package.json` — installed dependencies
7. Any image references (Grep for `<img`, `Image`, `.jpg`, `.png`, `.gif`, `.webp` in `src/`)

---

## Step 2 — Audit for performance issues

Evaluate these categories in order. For each issue found, record:
- **Title** (short, actionable)
- **Severity**: `major` or `minor`
- **Location**: file path(s) and line numbers where relevant
- **Problem**: what causes the performance cost
- **Fix**: concrete, specific change to apply
- **Impact**: expected user-facing improvement (e.g. "reduces TTI", "smaller JS bundle", "avoids layout shift")

### Categories to check

**Bundle size / hydration**
- React islands loaded with `client:load` when `client:visible` would suffice (defer hydration until in-viewport)
- Large third-party dependencies imported where a smaller alternative or native API would work
- Components that import the entirety of a library but only use one function (e.g. full lodash vs named import)
- Leaflet loaded on pages that don't show a map

**Data fetching**
- GraphQL queries that fetch more fields than the page uses
- Missing or absent data deduplication where the same query is called multiple times
- `fetch` calls in Astro frontmatter that aren't parallelised with `Promise.all`
- No caching / stale-while-revalidate for slow API calls (KV cache absent where it would help)

**Images**
- `<img>` tags without explicit `width`/`height` (causes layout shift)
- Missing `loading="lazy"` on below-the-fold images
- Images served in formats that could be WebP
- No use of Astro's `<Image>` component where it would auto-optimise

**CSS**
- Render-blocking stylesheets linked in `<head>` that could be inlined or deferred
- Unused CSS imported globally that is only needed in one component
- Animations using `top`/`left`/`width` instead of `transform` (forces reflow)

**Runtime / React**
- `useEffect` used to derive values that could be `useMemo`
- Expensive recalculations on every render that should be memoised
- Event handlers recreated on every render that should be `useCallback` (only flag if passed as props to children)
- Lists rendered without stable `key` props

**Astro-specific**
- Pages with no interactivity that load React at all
- `client:load` on components below the fold
- Missing `preload` hints for critical fonts or scripts

---

## Step 3 — Triage findings

Classify each finding as:

- **Major**: measurable impact on Core Web Vitals (LCP, CLS, FID/INP), significantly increases JS bundle, or causes repeated unnecessary network requests
- **Minor**: a real issue but low-impact in isolation (e.g. missing `loading="lazy"` on one image, a single redundant `useMemo` opportunity)

If there are **no findings worth reporting**, state that clearly with a brief summary of what you checked and why each category was clear. Stop here — do not create any issues.

---

## Step 4 — Create GitHub issues

Use `ToolSearch` to find `mcp__github__create_issue`, then create issues on the `jamesthemullet/rdldn` repo:

### For each MAJOR finding → one separate issue

**Title:** `perf: <short actionable title>`

**Labels:** `["performance"]`

**Body:**
```
## Problem

<What is causing the performance cost and where>

## Impact

<User-facing symptom — which Core Web Vital, which page, what users notice>

## Fix

<Specific change to make, with file paths and line numbers>

## Effort estimate

<S / M / L>
```

### For ALL MINOR findings → one combined issue

**Title:** `perf: minor performance improvements (batch)`

**Labels:** `["performance"]`

**Body:**
```
A collection of small performance improvements identified during an automated review.

## Findings

<!-- One section per finding -->

### <Finding title>

**File:** `<path:line>`
**Problem:** <one sentence>
**Fix:** <one sentence>

### <Next finding title>
...
```

If there are no minor findings, do not create the batch issue.

---

## Step 5 — Report

Output a summary in this format:

```
## Performance review complete

**Checked:** <list of categories audited>
**Major issues:** <count> — <issue URLs or "none">
**Minor issues:** <count> — <issue URL or "none">
**Outcome:** <one sentence summary>
```

---

## Judgement rules

- Only flag issues that are real and present in the code you can read. Do not flag hypothetical issues.
- Do not flag Knip `ignoreDependencies` entries as dead code / unnecessary imports.
- Do not flag Leaflet as "heavy" unless it is loaded on pages with no map.
- Do not flag `useCallback` unless the function is passed as a prop to a child component — otherwise it is premature optimisation.
- Prefer concrete file paths over vague statements like "consider optimising images".
- If you are unsure whether something is a real problem, err on the side of not creating an issue.
