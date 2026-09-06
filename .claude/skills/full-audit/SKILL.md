---
name: full-audit
description: Run a full audit of the Roast Dinners in London (rdldn) site — an Astro app with React/Alpine islands, Clerk auth, Neon/Drizzle database, and a WordPress GraphQL content backend — covering test coverage gaps, accessibility, performance, SEO, responsive/UX, security, code quality (strict typing, duplication, bad patterns, dead code), and README/feature alignment. Appends new findings to a persistent AUDIT.md checklist in the repo (existing checked-off items are preserved). Use when the user asks to audit, review the health of, or find improvements for the whole site — not for reviewing a single PR/diff (use /code-review for that).
---

# Full site audit

Produces a holistic health report for the `rdldn` app: an Astro 7 site (React + Alpine.js
islands) that renders content pulled from a WordPress GraphQL backend, with Clerk for auth,
Neon (Postgres) via Drizzle ORM for app data (visits, wishlist, passport), and Vercel API
routes/cron under `src/pages/api`. This is NOT a PR/diff review — lint (Biome), type-check
(`astro check`), unit tests, Playwright e2e, and an axe accessibility scan are already enforced
as CI gates on every PR (see `.github/workflows/pull_request_audit.yml` and `knip.yml`), so
**do not re-check whether the app lints/type-checks/builds/passes existing tests — it already
does**. This audit looks at things no single PR's gates catch: coverage gaps in files nobody's
touched recently, a11y/perf/SEO issues beyond the one smoke-level axe scan in CI, cross-cutting
site quality, and code quality that a passing type-check doesn't guarantee (e.g. `any` and
unsafe casts still compile cleanly — see category 8).

## When to run this

User asks to "audit the site", "find ways to improve the website", "do a full review of the
app", or similar whole-app requests. If they ask about a single PR or the current diff, use
`/code-review` instead.

## Output

Findings live in a single persistent file at the repo root: **`AUDIT.md`**. This is not a
one-off report — it's a living checklist that accumulates across runs. Each run **appends**,
never replaces:

- `AUDIT.md` has one `## <n>. <Category>` section per category below, in the same order, each
  containing a flat markdown checklist (`- [ ] finding text (found: YYYY-MM-DD)`).
- **Before writing anything**, read the current `AUDIT.md` in full (create it from the template
  below if it doesn't exist yet).
- For each category, compare this run's findings against what's already listed in that section:
  - If a finding already exists (same issue, same file/route — wording may differ slightly),
    **do not duplicate it**. Leave the existing line untouched.
  - If an existing unchecked item no longer reproduces (verify, don't assume — re-check it),
    check it off and add `(resolved: YYYY-MM-DD, verified during audit)` rather than deleting
    the line, so there's a record.
  - **Never touch a line that's already checked off (`- [x]`)** — those are the user's own
    record of completed work. Leave them exactly as-is, in place.
  - Genuinely new findings get appended to the bottom of that section's list as new `- [ ]`
    items, dated.
- Add a line to the `## Run log` section at the top with today's date and a one-line summary
  (e.g. "2026-08-31 — 4 new findings (2 a11y, 1 security, 1 code quality), 1 item resolved").
- Do not renumber, reorder, or rewrite prose outside the checklists — this file is meant to be
  readable as a diff over time.

Do not modify application code during the audit unless the user explicitly asks you to fix
something after seeing the report — this skill is read-only/diagnostic aside from editing
`AUDIT.md` itself.

### AUDIT.md template (use this structure if the file doesn't exist yet)

```markdown
# Site Audit

Living checklist maintained by the `/full-audit` skill. Findings are appended, never rewritten;
check an item off (`- [x]`) once you've fixed it and it won't be touched again. Re-running the
audit adds new findings to the bottom of each section and leaves checked items alone.

## Run log

- YYYY-MM-DD — initial audit

## 1. Test coverage — unit gaps and e2e

## 2. Accessibility

## 3. Performance

## 4. SEO / metadata

## 5. Responsive / UX

## 6. Security

## 7. README / feature alignment

## 8. Code quality
```

## How to run it

Fan out the categories below as parallel forks or a general-purpose subagent per category (they
are independent and read-heavy — keep the raw output out of your main context). Have each one
**report findings back as text**, not write to `AUDIT.md` directly — only you should touch that
file, in a single merge pass at the end, so the dedup/checked-item rules above are applied
consistently in one place. Categories needing the browser (a11y/perf/responsive) should run
together in one browser-driving pass since they all need the app running.

Before starting, check whether a dev server is already running; if not, start it yourself with
`yarn dev` (Astro dev server, port 4321) for the duration of the audit, and stop it when done
unless the user is already running it. Some routes and API endpoints need `PUBLIC_GRAPHQL_URL`,
`DATABASE_URL`, `PUBLIC_CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY`, and `SCORE_SECRET` — check
`.env` is populated locally before assuming a route is broken versus just missing config.

### 1. Test coverage — unit gaps and e2e

- Run `yarn test:coverage` (Vitest). Even though CI enforces `yarn test` passing, coverage
  itself is not gated on touched files here — list every file below 100% (or below whatever the
  project's practical baseline is, since `src/lib/*.ts` mostly carries `*.test.ts` siblings
  already) and call out ones with no test file at all, especially in `src/components/**`.
- **E2e coverage**: Playwright specs already exist under `tests/e2e/` (comment-form,
  guessthescore, maps, mobile-nav, newsletter-popup, post-pages, search, smoke). Read each spec
  to see what it actually asserts (not just that it exists), then check real user flows against
  that list and flag gaps, e.g.:
  - Auth flows via Clerk (sign in/up, signed-in vs. signed-out UI, protected API routes)
  - Wishlist and visit-tracking flows (`/api/wishlist`, `/api/visits`) end-to-end from the UI
  - Passport/badges flow (`/api/passport/badges`, `/api/passport/og` image generation)
  - Sunday roast planner and random pub picker components
  - Borough/chain listing pages and pagination/sort/search interplay
  For each gap, recommend a specific new spec file under `tests/e2e/`, scoped to one flow.

### 2. Accessibility

- CI already runs an axe smoke check against the homepage only (`.github/workflows/pull_request_audit.yml`,
  `axe` job) — treat that as covering `/` only, not the whole site. Run axe (via browser console
  injection or Lighthouse a11y score through `claude-in-chrome`) against other routes: post
  pages, boroughs, chains, guessthescore, passport pages.
- Manual: color contrast, focus order/visible focus states, form labels (comment form,
  newsletter signup), keyboard-only completion of interactive widgets (map, dropdown, sort/search
  controls, guess-the-score game).
- Note: the app ships `accented` (a client-side a11y-issue highlighter) — check whether it's
  wired up for dev-only use or could surface issues it's flagging that haven't been triaged.

### 3. Performance

- Lighthouse performance score and Core Web Vitals (LCP, CLS, INP) per route, particularly
  content-heavy ones (post pages with images, the roast map with Leaflet, borough/chain listing
  pages).
- Astro build output: bundle size per route, hydration cost of React/Alpine islands (check for
  islands hydrating eagerly that could use `client:visible`/`client:idle`), image weight and
  formats, Partytown offload coverage for third-party scripts.
- API routes: response time on `/api/passport/og` (image generation), `/api/wishlist`,
  `/api/visits`, and the GraphQL fetch layer (`src/lib/graphql.ts`, `src/lib/api.ts`) — check for
  missing caching (`@vercel/kv` is a dependency; confirm it's actually used where it should be).

### 4. SEO / metadata

- Per-route title/meta description via `astro-seo`, Open Graph tags (including the
  `@vercel/og`-generated passport images), canonical URLs, `sitemap.xml` (via
  `@astrojs/sitemap`) completeness, `robots.txt` correctness given `middleware.js` blocks known
  bad bots, semantic heading structure per route.

### 5. Responsive / UX

- Screenshot each major route at ~375px and ~1280px via `claude-in-chrome` — homepage, a post
  page, borough/chain listing, guessthescore, passport, wishlist. Look for anything drifted or
  never verified holistically (e.g. interactions between components added in different PRs, the
  newsletter popup overlapping content on mobile).
- Console errors on load/navigation (`read_console_messages`), broken links, dead-end states,
  the mobile nav's behavior across breakpoints (there's already `mobile-nav.spec.ts` — check it
  against what you observe manually).

### 6. Security

- Auth review: Clerk session handling, which routes/API endpoints are actually protected vs.
  should be, whether `CLERK_SECRET_KEY`/`SCORE_SECRET`/`DATABASE_URL` could leak client-side
  (check any `PUBLIC_`-prefixed vs. non-prefixed env var usage in `src/`).
  Confirm `sanitize-html` (`src/lib/sanitize.ts`) is applied everywhere user- or CMS-supplied
  HTML is rendered.
- `vercel.json` already sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` — check these are still adequate (e.g. is a CSP header worth adding) and
  that they actually apply to all relevant routes, not just the catch-all.
- Dependency vulnerabilities: `yarn audit` (or check Renovate's open PR backlog via
  `renovate.json`) and Vercel/Neon/Clerk key rotation hygiene.

### 7. README / feature alignment

There's no separate roadmap doc — compare `README.md`'s stated tech stack and feature
description against what's actually live in `main`:

- Every command listed in the README's "Commands" table still exists and works as described
  (cross-check against `package.json` scripts).
- The "Tech stack" section is still accurate (e.g. no since-removed/added major dependency).
- Any feature implied by the codebase (e.g. `guessthescore`, `passport`, `wishlist`) but not
  mentioned in the README, or vice versa — a README claim with no corresponding live route.

### 8. Code quality

A passing lint/type-check/build only proves the code compiles cleanly, not that it's precisely
typed, non-duplicated, or free of dead weight — that's what this category covers. Knip already
runs in CI for unused exports/files/dependencies, so don't just re-run `yarn knip` and report its
raw output verbatim — spot-check a few of its findings plus look for what it structurally can't
catch.

- **Strict typing** — explicit `any`, unsafe `as Type` casts, missing return type annotations on
  exported functions, non-null assertions (`!`) that could be replaced with a proper guard,
  params typed as `object` or `{}`, places relying on Astro's looser `.astro` frontmatter typing
  where a `.ts` helper would be safer.
- **Code duplication** — repeated logic across `src/lib/*.ts` (e.g. GraphQL fetch/query patterns
  in `src/lib/graphql.ts` and `src/lib/api.ts` that should share a helper), duplicated
  data-fetching logic between `.astro` pages that could move into `src/lib`, values inlined 3+
  times that should be a named constant.
- **Bad patterns** — Biome's `noUnusedVariables`/`noUnusedImports` are turned **off** in
  `biome.json` — this is a gap lint won't catch, so actively look for unused locals/imports.
  Also: React `useEffect` with missing/overly broad dependency arrays, Alpine.js inline
  `x-data`/`x-on` logic that's grown too large to stay inline, magic numbers/strings, inline
  `style=` attributes that should be CSS classes given the project's per-component CSS
  convention.
- **Dead code** — exported symbols not imported anywhere (cross-check a sample against Knip's
  ignore list in `knip.json`, since some are deliberately excluded), commented-out code blocks
  left in files, the `.bak` files at the repo root (`astro.config.mjs.bak`, `vitest.config.ts.bak`)
  that look stale and worth removing or explaining.

## Notes

- This is a personal/small project — keep findings proportionate. Don't recommend enterprise-
  scale tooling (e.g. a full CI a11y pipeline) as a "blocker"; note it as a "nice to have" instead
  unless it's actually broken for a real user.
- Cite every finding with a route, file:line, or screenshot — no vague "could be improved"
  entries.
- **Every checklist item must be independently reviewable as one small PR** — small, focused
  diffs only. If a finding is actually a bundle of unrelated or large changes (e.g. "add e2e
  coverage for auth flows", "improve accessibility across the app", "harden security headers"),
  split it into several separate `- [ ]` lines, each scoped to a single reviewable change (e.g.
  one line per flow's e2e spec, one line per route's a11y fix, one line per security header).
  Never write a checklist item a reviewer couldn't approve or reject on its own without also
  weighing in on unrelated changes bundled into it.
