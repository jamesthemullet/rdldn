# Product Roadmap — Roast Dinners in London

The site already does the hard part: hundreds of reviews, boroughs, tube lines, a stats engine, a
passport with badges, and a scoring game. What it's missing is a reason to come back on a
**Wednesday** — not just a Sunday, and a way for the content it already has to surface itself
better. This roadmap isn't only new features: it also covers making existing content easier to
find, SEO, and sharpening features/pages that already exist but are underbaked. Everything below
is scored against four jobs:

- **Acquisition** — brings new visitors in
- **Engagement** — deepens a single visit
- **Retention** — earns a repeat visit
- **Fun** — no metric, just delight

Every feature is broken into a **PR sequence** — each step small enough for a human to review in
about 15 minutes. That's a guideline, not a rule: where splitting further would just create
PRs that don't work standalone, they're left combined and marked accordingly.

## Now (ship in weeks — reuses existing infra)

Everything here leans on plumbing that already exists: the stats engine behind Roastatistics, the
OG-image generator built for the Passport, the leaderboard behind Guess the Score, the Leaflet map.

### 1. Roast Wrapped — *Acquisition, Fun, Retention*
A personal, shareable year-in-review card: roasts visited, favourite borough, best-value find, your
"roast personality." Spotify Wrapped, but for gravy. Drops every December.

1. Query: aggregate a signed-in user's yearly stats (visits, boroughs, best-value find) from
   existing visit/wishlist tables — data layer only, no UI.
2. Share-card page + OG image, copying the existing passport-share-card / `api/passport/og.ts`
   pattern with the new data.
3. "Roast personality" label — a small pure function mapping stats to a label, plus tests.

### 2. Roastle — *Engagement, Retention, Acquisition*
A daily "guess the score" puzzle with one attempt, a streak counter, and a Wordle-style emoji grid
to share the result. Turns an existing game into a daily habit.

1. Deterministic daily post picker — a pure function (`postForDate(date)`) + a route exposing it.
2. Streak persistence — store last-played day + current streak in KV; increment/reset logic and tests.
3. Emoji-grid share text generator — pure function + tests, reusing the share-button pattern.
4. UI: wire "daily mode" into the existing Guess the Score page (single attempt, streak display).

### 3. Since you last ate — *Retention*
A quiet banner for signed-in users: "4 new roasts reviewed since your last visit, 2 in Hackney."

1. Persist a last-seen timestamp for signed-in users, updated on each visit.
2. Query: posts published since a given timestamp, optionally scoped by borough — pure function + tests.
3. Banner component on the homepage rendering the result.

### 4. Nearest roast — *Acquisition*
One-tap, geolocation-based "closest great roast to me right now."

1. Haversine distance util + unit tests (pure function, no UI).
2. Component: request geolocation, sort existing post data by distance, render top results.

*Small enough that these two could land as one PR if a reviewer prefers — flagged as optional split.*

### 5. Rich search snippets — *Acquisition*
Review/LocalBusiness structured data on every post so Google shows star ratings and price directly
in search results.

1. **One PR.** A single JSON-LD block added to the post template from fields that already exist —
   no new logic, nothing to split.

### 6. Embeddable rating badge — *Acquisition*
A small "As rated on Roast Dinners in London — 4.2★" badge pubs can embed on their own site.

1. **One PR.** One new API route rendering a static SVG per venue slug — self-contained, nothing
   else depends on or feeds it.

### 7. Related roasts — *Engagement, Retention*
"You might also like" links at the bottom of every post — same borough, same tube line, or a
similar rating/price band — so a single visit doesn't dead-end after one review.

1. Query: given a post, find 3-5 related posts by shared borough/chain/tube line — pure function
   + tests, using data already fetched for boroughs/chains pages.
2. Component rendering the related-posts list on `[slug].astro`.

### 8. Internal search upgrade — *Engagement, Acquisition*
`search.astro` exists but is a plain keyword box — no filters, no sort, no "search within
borough." Improving an existing page rather than building a new one.

1. Extend the existing search query layer to accept a borough/sort param — pure function + tests.
2. Filter/sort controls added to the existing search UI.

### 9. Roast Wrapped's SEO cousin: borough guides — *Acquisition, Fun*
Static, editorial-light "Best Sunday Roasts in [Borough]" landing pages generated from data
that's already there (Roastatistics + League of Roasts), targeting search terms the site can
already answer but doesn't have a dedicated page for.

1. Query: top-N posts per borough by rating/value — pure function + tests, reusing the
   Roastatistics data layer.
2. Static page template (`/boroughs/[borough]/best.astro` or similar), reusing the existing
   boroughs page layout and internal-linking into individual post pages.

## Next (this quarter — moderate new build)

Bigger dishes: new mechanics and a first outbound channel.

### 10. Roast Battle — *Engagement, Fun*
A quick "which roast wins" head-to-head swipe that quietly feeds a crowdsourced Elo ranking.

1. Migration: add an `elo_score` column to posts (or a companion table).
2. Elo update function + unit tests — pure math, reviewable on its own.
3. Swipe UI component — static, posts to a stub endpoint that does nothing yet.
4. Vote API route — wires the swipe UI to the Elo update function.
5. Surface the Elo column as a sortable option in League of Roasts.

### 11. Roast crews — *Retention, Engagement*
Follow other roast-hunters, compare Passports, run a private leaderboard for your group of mates.

1. Migration: a `follows` table (follower/following user IDs).
2. Follow / unfollow API endpoints + tests.
3. "Find people" search UI.
4. Scoped leaderboard query — visit counts filtered to a user's follows — pure function + tests.
5. Group leaderboard UI, reusing the existing League of Roasts table component.
6. Side-by-side Passport comparison view (optional, can ship later independently).

### 12. The Sunday Post — *Retention, Acquisition*
A weekly digest email: new reviews near your wishlist or borough, this week's Roastle streaks, one
Roast Battle prompt. The site's first outbound channel.

1. **Infra (Mise en Place):** pick and wire an email provider — env vars + a `sendTestEmail` utility, no feature logic.
2. Digest content query — new posts near a user's wishlist/borough — pure function + tests.
3. HTML email template for the digest.
4. Scheduled job (Vercel cron) that assembles and sends the digest weekly.
5. Unsubscribe / preference handling — a small settings toggle + honouring it in step 4.

### 13. Dietary & occasion filters — *Acquisition, Fun*
Filter Search and League of Roasts by veggie/vegan nut roast, gluten-free Yorkshires, kid-friendly.

1. **Not a PR — a content task.** Tag existing posts with dietary/occasion metadata in the
   WordPress backend before any code can filter on it. Tracked as
   [#632](https://github.com/jamesthemullet/rdldn/issues/632).
2. Filter support in the Search query layer (accept a tag param) + tests.
3. Filter UI control on the Search page.
4. Same filter added to League of Roasts, reusing the Search filter component from step 3.

### 14. Price history, per venue — *Engagement*
A small sparkline on each post showing how that specific roast's price has moved over time.

1. **Data check first, not really a PR:** confirm venues actually have multiple price points over
   time (the current Inflation Index aggregates *across* posts, not within one venue's history) —
   this may turn out to need a data-model change before any UI work is worth doing.
2. Once confirmed: a query extracting one venue's price points — pure function + tests.
3. Sparkline component (presentational only, sample data).
4. Wire the sparkline into the post page.

## Later (bigger bets — new infra)

Each needs a kitchen upgrade first, but they're what turns the site from "a list someone
maintains" into "a community that maintains itself."

### 15. Community reviews — *Engagement, Retention*
Users add their own short review and photo alongside the editorial one, moderated before going live.

1. Migration: a `community_reviews` table with a status (`pending` / `approved` / `rejected`).
2. Submission API route — writes a new review as `pending`, no UI yet.
3. Submission form UI on the post page, posting to step 2.
4. Admin moderation queue UI — list pending reviews, approve/reject buttons.
5. Render approved community reviews on the post page.

### 16. Wishlist alerts — *Retention*
Opt-in push notification when a wishlisted pub gets a new review, or a Roastle streak is about to lapse.

1. **Infra (Mise en Place):** web push setup — service worker registration + VAPID keys, no feature logic yet.
2. Subscription opt-in UI + an endpoint that stores the subscription.
3. Trigger: on a new review matching a user's wishlist, send a push — server-side, reuses step 1's send utility.
4. Trigger: streak-about-to-lapse reminder, reusing the same send utility from step 3.

### 17. Roast Crawl planner — *Fun, Acquisition*
Extend the Sunday Roast Planner into a shareable, multi-stop itinerary across boroughs or tube stops.

1. Extend the planner's state model from one stop to N stops (data model change inside the
   existing component, no new UI yet).
2. UI for adding / removing / reordering stops.
3. Generate and persist a shareable itinerary slug/URL.
4. Read-only page rendering a shared itinerary from that slug.

## Mise en place — infrastructure prerequisites

Some steps above are infra, not features — called out here since they're each already close to a
single 15-minute PR on their own, and several features depend on the same one:

| Investment | Unlocks |
| :--- | :--- |
| **Email provider** (Sunday Post step 1) | The Sunday Post digest, and any future lapsed-user win-back. |
| **Web push** (Wishlist Alerts step 1) | Wishlist Alerts and streak reminders. |
| **Moderation queue** (Community Reviews steps 1 & 4) | Community Reviews. |
| **Structured data** (Rich Search Snippets) | Rich Search Snippets and the embeddable badge's credibility. |
| **Sitemap hygiene** | Fix before shipping more acquisition plays — private routes (`/my-passport`, `/my-roasts`, `/flags`) still leak into the sitemap, and no page carries a visible, page-specific `<h1>`. Both blunt the SEO wins above. This is itself one small PR. |

---
*Roast Dinners in London — product roadmap, 1 September 2026*
