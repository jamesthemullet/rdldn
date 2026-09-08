---
name: product-roadmap
description: Build or refresh a product roadmap for the Roast Dinners in London (rdldn) site — new features, pages, and content, PLUS making existing content easier to find, SEO, and improvements to features/pages that already exist — grounded in what the app already has, aimed at acquisition, engagement, retention, and fun. Writes a plain markdown ROADMAP.md at the repo root, grouped into Now/Next/Later, with each feature broken into a sequence of ~15-minute-reviewable PR steps. Use when the user asks for a roadmap, growth ideas, "what should we build next", or to update/rescope the existing roadmap — not for auditing existing code health (use /full-audit) or pitching a single feature (use /product).
---

# Product roadmap

Produces (or refreshes) **`ROADMAP.md`** at the repo root: a markdown roadmap for the `rdldn`
app, scored against what actually moves the site forward, and broken into small enough steps
that a human can review each one in about 15 minutes. The roadmap is not only new features — it
must always also cover three things the app already has:

- **Findability** — making existing content (hundreds of reviews, boroughs, chains, stats pages)
  easier to discover: internal linking, related/similar posts, breadcrumbs, richer search,
  better navigation between related pages.
- **SEO** — beyond one-off hygiene fixes (those belong in `AUDIT.md`), roadmap-level SEO plays:
  structured data, better indexability of existing content, internal link equity, content that
  targets underused search intent the site could already answer.
- **Improving what already exists** — a feature or page that's live but underbaked (e.g. search
  has no filters, the map has no clustering, League of Roasts has no saved views) is as valid a
  roadmap item as a brand-new one, and often cheaper to ship.

Brand-new features are one category among these, not the whole roadmap.

## When to run this

User asks to build/update a product roadmap, wants growth/engagement/retention ideas, asks "how
do we make this more useful/fun/sticky", or wants the existing `ROADMAP.md` rescoped (e.g. split
into smaller PRs, reprioritized, pruned). If they want a single feature pitched and explored in
depth, that's `/product` instead. If they want the current codebase's *health* reviewed rather
than new feature ideas, that's `/full-audit`.

## Output format

Plain markdown, not an HTML artifact — this has been requested explicitly before and is the
standing preference for this deliverable. Write directly to `ROADMAP.md` at the repo root,
overwriting the previous version (git history preserves prior versions; don't keep an "old
roadmap" section).

Structure:

1. **Intro** — one short paragraph naming the gap the roadmap addresses, followed by the scoring
   lenses as a bullet list. Default lenses (adjust only if the user asks for different ones):
   - **Acquisition** — brings new visitors in
   - **Engagement** — deepens a single visit
   - **Retention** — earns a repeat visit
   - **Fun** — no metric, just delight
2. **PR-sequence explainer** — one short paragraph stating that every feature is broken into a
   PR sequence sized for ~15-minute human review, and that genuinely atomic changes are left as
   one PR rather than artificially split.
3. **Now / Next / Later** sections, ordered by effort and how much new infrastructure they need:
   - **Now** — ships in weeks, reuses existing infra/patterns entirely.
   - **Next** — this quarter, moderate new build (new tables, new routes, no new third-party
     services).
   - **Later** — bigger bets that need a new infra dependency first (email provider, push,
     moderation tooling, etc).
4. Each feature is a `### N. Name — *Goal tags*` heading, one-line description, then a numbered
   PR-step list (see "Breaking a feature into PR steps" below).
5. **Mise en place** table at the end — infra prerequisites that block one or more features
   (email provider, web push, moderation queue, etc), cross-referencing which feature/step needs
   each one, so shared infra isn't proposed twice.
6. Footer: `*Roast Dinners in London — product roadmap, <today's date>*`.

## Grounding the roadmap in the real app

Before inventing features, read the actual site so every idea reuses something that exists
rather than assuming new infra:

- `README.md` — stated tech stack and feature list.
- `AUDIT.md` if present — don't duplicate known bugs/gaps as "roadmap features"; SEO/infra
  hygiene items already tracked there (e.g. sitemap noindex leakage, missing H1s) belong in
  Mise en place as blockers, not as new features.
- `package.json` — confirm what infra genuinely doesn't exist yet (email provider, push,
  analytics) before proposing a feature that assumes it does.
- `Glob` over `src/pages/**/*.astro` and `src/**/*.{ts,tsx}` — enumerate real pages, components,
  and lib helpers (stats/scoring logic, the passport badge + OG-image generator, the
  leaderboard/KV cache, the map, planner, wishlist/visit tracking, sort/search) so every roadmap
  item's PR steps can name a concrete existing pattern to extend or reuse.

Every feature description should be traceable to something concrete in the repo it builds on —
avoid generic SaaS feature ideas that don't fit a roast-dinner review site.

## Breaking a feature into PR steps

For each feature, sequence its implementation as data layer → business logic → UI → wiring,
splitting wherever a step could stand alone as a reviewable, mergeable change:

- A migration or schema change is its own step.
- A pure function (query, scoring/math, formatter) plus its unit tests is its own step —
  reviewable without needing to read any UI.
- New UI is its own step, built against existing or stubbed data.
- Wiring UI to a live endpoint/data source is its own step if steps 2 and 3 above are
  substantial; fold it into the UI step if trivial.
- Shared infra setup (email provider, web push, moderation tooling) is step 1 of whichever
  feature needs it first, labeled **"Infra (Mise en Place):"**, and also listed in the Mise en
  place table.
- A step that's actually a non-code task (CMS content tagging, a manual data-availability check)
  gets labeled **"Not a PR"** / **"Data check first, not really a PR"** rather than forced into
  the PR-step numbering as if it were code.
- If a step needs new **human-written content** (copy, editorial tagging, photography, a written
  policy/FAQ, anything a person has to sit down and write rather than code) — not just a
  mechanical data check — raise a GitHub issue for it with `mcp__github__create_issue` rather
  than only noting it in the roadmap text. Title it plainly (e.g. "Content: tag existing posts
  with dietary/occasion metadata"), body naming the feature it blocks and what "done" looks like,
  and reference the issue number/link next to that step in `ROADMAP.md` so it's tracked
  somewhere actionable instead of buried in a markdown file. Do this for each such step found,
  after the roadmap content itself is finalized — confirm with the user first if it's unclear
  whether they want issues opened automatically for a given run.
- If a feature is small enough that splitting would just produce dependent stubs with nothing to
  review independently, don't split it — write **"One PR."** and say why in one clause.
- If two adjacent steps are borderline (each is small but splitting is defensible either way),
  keep them separate but add a one-line note that they could be combined at a reviewer's
  discretion.

The 15-minute bar is a guideline, not a hard rule — steps that must land together to be
reviewable at all (e.g. a migration with the one query that immediately uses it, if the query is
trivial) can stay combined.

**Feature-flag multi-step features.** If a feature has 3+ PR steps that touch user-visible
behaviour (not just internal data-layer work), its first UI-facing step should add a new key to
`FLAG_DEFINITIONS` in `src/lib/featureFlags.ts` (default `false`) and gate the new UI behind it,
the same way `visitTracking` and `myPassport` already work. Say so explicitly in that step, e.g.
"UI component, gated behind a new `roastBattle` flag (`src/lib/featureFlags.ts`), defaulting
off." This lets each step merge to main safely mid-feature instead of needing a long-lived
branch, and lets the feature be switched on (via `/flags`) once the whole sequence has landed.
Skip this for features that are one PR, or whose steps are all internal (migrations, pure
functions with no UI) until the final UI step.

## Notes

- This is a personal/small project — don't propose enterprise-scale features (e.g. a full CMS,
  a mobile app) as "Now" or "Next" items; if worth mentioning at all, they belong in "Later" with
  the infra cost stated plainly.
- Don't re-propose anything already tracked as an open item in `AUDIT.md` — that's a health fix
  (something broken or missing that should just be fixed), not a roadmap feature. The line:
  fixing the sitemap's noindex leakage is a health fix (AUDIT.md); adding related-posts links to
  grow session depth is a roadmap feature (findability, here).
- Do not commit, push, or open a PR for `ROADMAP.md` changes unless the user explicitly asks —
  this skill only writes the file locally.
