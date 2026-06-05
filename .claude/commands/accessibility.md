---
description: Incrementally improve accessibility — picks one WCAG issue, fixes it, and opens a PR with the change. No findings is also an acceptable outcome.
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash
  - PowerShell
  - ToolSearch
---

You are running an incremental accessibility improvement session for **rdldn** — Roast Dinners in London.

Your job: find **one** real, fixable WCAG 2.1 AA issue in the codebase, fix it, and open a PR. No findings is a valid outcome — do not manufacture problems.

---

## Stack

- **Framework:** Astro 6 with React 19 islands (`client:load`, `client:visible`)
- **TypeScript:** Strict mode
- **Styling:** Plain CSS files in `src/styles/`; no inline `<style>` blocks in `.astro` files
- **State:** Local hooks only — `useSortFilter()` uses `useReducer`, `RoastMap` uses `useState`
- **Maps:** Leaflet (`src/components/roast-map/roast-map.tsx`)
- **Source files:** `src/pages/`, `src/components/`, `src/layouts/`, `src/lib/`
- **Linter:** Biome (`biome.json`)

---

## Step 1 — Gather data

Read in parallel:

1. All files in `src/components/` (Glob `src/components/**/*.{tsx,astro}`)
2. All files in `src/layouts/` (Glob `src/layouts/**/*.astro`)
3. All files in `src/pages/` — sample a representative cross-section (home, a post page, search, archive, guessthescore)
4. Any global CSS: Glob `src/styles/**/*.css`

---

## Step 2 — Audit for accessibility issues

Evaluate these categories. For each issue found, record:
- **Title** (short, actionable)
- **Severity**: `major` or `minor`
- **Location**: file path(s) and line numbers
- **Problem**: which WCAG criterion is violated and why
- **Fix**: concrete, specific change to apply
- **Fixable now**: yes/no (some issues, like missing skip-nav, require new markup; layout issues may be risky to touch without visual testing)

### Categories to check

**Images and media**
- `<img>` tags missing `alt` attributes (WCAG 1.1.1)
- `<img>` tags with empty `alt=""` where the image is meaningful (not decorative)
- Decorative images that still have descriptive alt text (adds noise for screen readers)

**Semantic structure**
- Heading hierarchy skipping levels (e.g. `<h1>` → `<h3>`, no `<h2>`) — WCAG 1.3.1
- Pages missing a top-level `<h1>`, or having more than one `<h1>`
- Interactive elements (`<div>`, `<span>`) that are clickable but lack `role="button"` and keyboard support
- Navigation landmarks: missing `<nav>`, `<main>`, `<header>`, `<footer>` where appropriate

**Forms and interactive controls**
- `<input>` or `<textarea>` elements missing an associated `<label>` (WCAG 1.3.1, 3.3.2)
- Buttons with no accessible name (no text content, no `aria-label`) — WCAG 4.1.2
- `<select>` elements without labels

**Keyboard accessibility**
- `onClick` handlers on non-interactive elements without `onKeyDown`/`onKeyPress` equivalents — WCAG 2.1.1
- `tabIndex` set to a positive integer (breaks natural tab order) — WCAG 2.4.3

**Links**
- Anchor tags with non-descriptive text like "click here", "read more", "here" — WCAG 2.4.6
- Links that open in a new tab without warning the user — WCAG 3.2.2
- Empty `href` or `href="#"` used as a button instead of `<button>` — WCAG 4.1.2

**ARIA**
- Missing `aria-expanded` on toggleable elements (dropdowns, accordions) — WCAG 4.1.2
- Missing `aria-live` regions for dynamically updated content (e.g. sort/filter results) — WCAG 4.1.3
- `role` attributes that are redundant (e.g. `<button role="button">`)

**Page-level**
- Missing `lang` attribute on `<html>` — WCAG 3.1.1
- Missing skip-to-main-content link for keyboard users — WCAG 2.4.1
- `<title>` absent or duplicated across pages — WCAG 2.4.2

**Focus visibility**
- CSS that removes the default focus outline without a custom replacement (`outline: none` / `outline: 0` without `:focus-visible`) — WCAG 2.4.7

---

## Step 3 — Pick one issue to fix

Choose the **single clearest, most impactful** issue that you can fix confidently in this session. Prefer issues that:
- Have an unambiguous, self-contained fix (one or two files)
- Are in frequently-visited pages or components
- Do not require visual/manual verification to confirm correctness (e.g. adding a missing `alt`, `aria-label`, `lang`, or `<label>`)

If there are **no issues worth fixing**, state that clearly with a brief summary of what you checked. Stop here — do not create a branch or PR.

---

## Step 4 — Fix it

Apply the fix. Keep scope tight — one issue, one or two files. Do not refactor beyond what is needed.

After editing, run the build to confirm nothing is broken:

```
yarn build 2>&1 | tail -20
```

If the build fails, fix the error before proceeding.

---

## Step 5 — Create a branch and commit

Create a new branch from `main` and commit the fix:

```
git checkout main
git pull origin main
git checkout -b a11y/<short-slug>
git add <changed files>
git commit -m "a11y: <short description of fix>"
git push origin a11y/<short-slug>
```

Use a descriptive slug, e.g. `a11y/missing-alt-venue-card`, `a11y/lang-attribute`, `a11y/aria-expanded-sort`.

---

## Step 6 — Open a PR

Use `ToolSearch` to find `mcp__github__create_pull_request`, then create a PR on `jamesthemullet/rdldn`:

**Title:** `a11y: <short description>`

**Body:**
```
## What

<One sentence describing the fix>

## Why

**WCAG Criterion:** <e.g. "1.1.1 Non-text Content — Level A">

<One sentence on who this helps and how>

## Change

- `<file path>` — <what changed>
```

---

## Step 7 — Report

Output exactly this structure:

```
## Accessibility improvement

**WCAG criterion:** <criterion>
**File:** <path:line>
**Issue:** <one sentence describing the problem>
**Fix:** <what was changed and why>
**PR:** <PR URL>
**Next suggestion:** <the next candidate worth tackling, with file path>
```

---

## Judgement rules

- Only flag issues that are real and present in the code you can read. Do not flag hypothetical issues.
- Do not flag Leaflet map containers as lacking `alt` — they are interactive widgets and need `aria-label`, not `alt`.
- Do not flag `role="presentation"` on layout tables — it is the correct usage.
- If an element has an `aria-label` that describes it well, do not also flag it for missing visible label text unless both are required.
- Do not flag issues in `node_modules` or generated files.
- If you are unsure whether something is a real problem, do not fix it.
