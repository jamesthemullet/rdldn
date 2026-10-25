# Product Roadmap — Roast Dinners in London

The site already does the hard part: hundreds of reviews, boroughs, tube lines, a stats engine,
and a scoring game. What it's missing is a reason to come back on a
**Wednesday** — not just a Sunday, and a way for the content it already has to surface itself
better. This roadmap isn't only new features: it also covers making existing content easier to
find, SEO, and sharpening features/pages that already exist but are underbaked. Everything below
is scored against four jobs:

- **Acquisition** — brings new visitors in
- **Engagement** — deepens a single visit
- **Retention** — earns a repeat visit
- **Fun** — no metric, just delight

## How to read this

Every checkbox is **one pull request** a human can review in about 15 minutes — tick it when that
PR merges. Within a feature, boxes are in merge order. Anything that isn't a code change (content
tagging, a decision) isn't a checkbox: it's a **Blocked by** line linking the GitHub issue that
tracks it. Features with several user-visible steps gate their UI behind a new key in
`FLAG_DEFINITIONS` (`src/lib/featureFlags.ts`, default off), so every PR can merge to `main` on
its own and the feature is switched on via `/flags` once the last box is ticked.

## Now (ship in weeks — reuses existing infra)

Everything here leans on plumbing that already exists: the stats engine behind Roastatistics, the
leaderboard behind Guess the Score, the Leaflet map.

### 1. Roastle — *Engagement, Retention, Acquisition*
A daily "guess the score" puzzle with one attempt, a streak counter, and a Wordle-style emoji grid
to share the result. Turns an existing game into a daily habit.

- [ ] Deterministic daily post picker — pure `postForDate(date)` function + tests, and a route exposing it.
- [ ] Streak persistence — store last-played day + current streak via `src/lib/kv.ts`; increment/reset logic + tests.
- [ ] Emoji-grid share text generator — pure function + tests, reusing the share-button pattern.
- [ ] "Daily mode" on the existing Guess the Score page (single attempt, streak display), gated behind a new `roastle` flag.

### 2. Nearest roast — *Acquisition*
One-tap, geolocation-based "closest great roast to me right now."

- [ ] Haversine distance util + unit tests (pure function, no UI).
- [ ] Component: request geolocation, sort existing post data by distance, render top results.

*Small enough that these two could land as one PR if a reviewer prefers.*

### 3. Richer review snippets — *Acquisition*
`[slug].astro` already emits `Review` JSON-LD with the rating, but `itemReviewed` is just a
`Restaurant` name — no price or location, so Google has less to show in results.

- [ ] Add `priceRange` and `address` (borough, London) to the existing `itemReviewed` block from fields the post already fetches, plus a test asserting the JSON-LD output.

### 4. Embeddable rating badge — *Acquisition*
A small "As rated on Roast Dinners in London — 4.2★" badge pubs can embed on their own site.

- [ ] One new API route rendering a static SVG per venue slug, plus tests — self-contained, nothing else depends on it.

### 5. Related roasts — *Engagement, Retention*
"You might also like" links at the bottom of every post — same borough, same tube line, or a
similar rating/price band — so a single visit doesn't dead-end after one review.

- [ ] Query: given a post, find 3-5 related posts by shared borough/chain/tube line — pure function + tests, using data already fetched for the boroughs/chains pages.
- [ ] Component rendering the related-posts list on `[slug].astro`.

### 6. Internal search upgrade — *Engagement, Acquisition*
`search.astro` exists but is a plain keyword box — no filters, no sort, no "search within
borough." Improving an existing page rather than building a new one.

- [ ] Extend the existing search query layer to accept a borough/sort param — pure function + tests.
- [ ] Filter/sort controls added to the existing search UI.

### 7. Borough guides — *Acquisition, Fun*
Static, editorial-light "Best Sunday Roasts in [Borough]" landing pages generated from data
that's already there (Roastatistics + League of Roasts), targeting search terms the site can
already answer but doesn't have a dedicated page for.

- [ ] Query: top-N posts per borough by rating/value — pure function + tests, reusing the Roastatistics data layer.
- [ ] Static page template (`/boroughs/[borough]/best.astro` or similar), reusing the existing boroughs page layout and linking into individual post pages.

## Next (this quarter — moderate new build)

Bigger dishes: new mechanics and a first outbound channel.

### 8. Roast Battle — *Engagement, Fun*
A quick "which roast wins" head-to-head swipe that quietly feeds a crowdsourced Elo ranking.

- [ ] Migration: a `post_elo` table keyed by post slug (posts live in WordPress, not Postgres).
- [ ] Elo update function + unit tests — pure math.
- [ ] Swipe UI component against a stub endpoint, gated behind a new `roastBattle` flag.
- [ ] Vote API route — wires the swipe UI to the Elo update function and `post_elo`.
- [ ] Surface Elo as a sortable column in League of Roasts.

### 9. Roast crews — *Retention, Engagement*
Follow other roast-hunters, compare stats, run a private leaderboard for your group of mates.

- [ ] Migration: a `follows` table (follower/following user IDs).
- [ ] Follow / unfollow API endpoints + tests.
- [ ] "Find people" search UI, gated behind a new `roastCrews` flag.
- [ ] Scoped leaderboard query — visit counts filtered to a user's follows — pure function + tests.
- [ ] Group leaderboard UI, reusing the existing League of Roasts table component.
- [ ] Side-by-side stats comparison view (optional — can ship later independently).

### 10. The Sunday Post — *Retention, Acquisition*
A weekly digest email: new reviews near your wishlist or borough, this week's Roastle streaks, one
Roast Battle prompt. The site's first outbound channel.

- [ ] **Infra (Mise en place):** wire an email provider — env vars + a `sendTestEmail` utility, no feature logic.
- [ ] Digest content query — new posts near a user's wishlist/borough — pure function + tests.
- [ ] HTML email template for the digest, rendered from sample data + a snapshot test.
- [ ] Opt-in / unsubscribe — a `digestOptIn` column + settings toggle, gated behind a new `sundayPost` flag.
- [ ] Weekly Vercel cron that assembles and sends the digest to opted-in users only.

### 11. Dietary & occasion filters — *Acquisition, Fun*
Filter Search and League of Roasts by veggie/vegan nut roast, gluten-free Yorkshires, kid-friendly.

> **Blocked by** [#632](https://github.com/jamesthemullet/rdldn/issues/632) — existing posts need
> dietary/occasion tags in WordPress before there's anything to filter on.

- [ ] Fetch the new tags in the post GraphQL query and accept a tag param in the Search query layer + tests.
- [ ] Filter UI control on the Search page.
- [ ] Same filter added to League of Roasts, reusing the Search filter component.

### 12. Price history, per venue — *Engagement*
A small sparkline on each post showing how that specific roast's price has moved over time.

- [ ] Query extracting one venue's price points across its posts — pure function + tests. Run it against live data in the PR description: if most venues have fewer than two price points, stop here and drop the rest of this feature.
- [ ] Sparkline component (presentational only, sample data).
- [ ] Wire the sparkline into the post page.

## Later (bigger bets — new infra)

Each needs a kitchen upgrade first, but they're what turns the site from "a list someone
maintains" into "a community that maintains itself."

### 13. Community reviews — *Engagement, Retention*
Users add their own short review and photo alongside the editorial one, moderated before going live.

- [ ] Migration: a `community_reviews` table with a status (`pending` / `approved` / `rejected`).
- [ ] Submission API route — writes a new text review as `pending`, no UI yet.
- [ ] Submission form UI on the post page, posting to the route above, gated behind a new `communityReviews` flag.
- [ ] Admin moderation queue UI — list pending reviews, approve/reject buttons.
- [ ] Render approved community reviews on the post page.
- [ ] **Infra (Mise en place):** photo upload — Vercel Blob storage + a `photoUrl` column, attached to the submission form.

### 14. Wishlist alerts — *Retention*
Opt-in push notification when a wishlisted pub gets a new review, or a Roastle streak is about to lapse.

- [ ] **Infra (Mise en place):** web push setup — service worker registration, VAPID keys in env, and a send utility. No feature logic.
- [ ] Subscription opt-in UI + an endpoint that stores the subscription, gated behind a new `wishlistAlerts` flag.
- [ ] New-review detection — a cron that compares the latest WordPress posts against a last-seen marker in KV and returns new slugs — pure diff function + tests.
- [ ] Send a push to users whose wishlist contains a newly detected slug, reusing the send utility.
- [ ] Streak-about-to-lapse reminder, reusing the same send utility.

### 15. Roast Crawl planner — *Fun, Acquisition*
Extend the Sunday Roast Planner into a shareable, multi-stop itinerary across boroughs or tube stops.

- [ ] Extend the planner's state model from one stop to N stops (data model change inside the existing component, no new UI) + tests.
- [ ] UI for adding / removing / reordering stops, gated behind a new `roastCrawl` flag.
- [ ] Generate and persist a shareable itinerary slug/URL.
- [ ] Read-only page rendering a shared itinerary from that slug.

## Ruled out

- **Roast Wrapped** (yearly stats recap) — duplicates the existing `/annual-roastatistics` page. Extend that page instead of building a parallel one.

## Mise en place — infrastructure prerequisites

Shared infra that more than one feature leans on, so it isn't built twice:

| Investment | First built in | Unlocks |
| :--- | :--- | :--- |
| **Email provider** | The Sunday Post, step 1 | The Sunday Post digest, and any future lapsed-user win-back. |
| **Web push** | Wishlist alerts, step 1 | Wishlist alerts and Roastle streak reminders. |
| **Moderation queue** | Community reviews, steps 1 & 4 | Community reviews, and any future user-submitted content. |
| **Blob storage** | Community reviews, last step | Review photos, and any future user uploads. |

---
*Roast Dinners in London — product roadmap, 25 October 2026*
