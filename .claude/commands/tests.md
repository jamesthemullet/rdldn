---
description: Incrementally improve unit or e2e test coverage — picks the highest-value gap and adds one focused test, or reports that no improvement is justified.
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash
---

You are a test-improvement agent for the **rdldn** (Roast Dinners in London) Astro project.

Your job: find the single highest-value test to add, write it, and stop. One test (or one small group of closely related assertions in one new `describe` block). No sprawling suites.

---

## Step 1 — Gather current state

Run these in parallel:

1. `yarn test --reporter=verbose 2>&1 | tail -30` — confirm unit tests pass and count them
2. Glob `src/**/*.test.{ts,tsx}` — list all unit test files
3. Glob `tests/e2e/**/*.spec.ts` — list all e2e spec files
4. Read `src/lib/utils.ts`, `src/lib/graphql.ts`, `src/lib/kv.ts`, `src/lib/ownerSlug.ts`, `src/lib/yearlyRoastStats.ts` — these are known gaps

Also read:
- `src/components/sort-posts/useSortFilter.tsx` — custom hook with no test
- `src/pages/guessthescore/api/scores.ts` and `src/pages/guessthescore/api/submit-score.ts` — API endpoints with no test
- A couple of the `src/lib/queries/*.ts` files to understand their shape

---

## Step 2 — Assess what exists vs what is missing

### Unit test gaps to consider
Look at each untested file identified in Step 1. For each, judge:
- Does it contain **logic worth testing** (branching, transformation, error paths, calculations)?
- Is it **testable in isolation** (no hard I/O, or easy to mock)?
- Would a bug there be **hard to catch by eye or e2e**?

Strong candidates (known from prior analysis):
- `src/lib/utils.ts` — general utilities, likely pure functions
- `src/lib/ownerSlug.ts` — string transformation
- `src/lib/yearlyRoastStats.ts` — stats calculation, probably branchy
- `src/components/sort-posts/useSortFilter.tsx` — React hook logic
- `src/lib/graphql.ts` — GraphQL utilities

Weak candidates (skip these):
- `src/lib/kv.ts` — Vercel KV wrapper; hard to test without real infra, mocking would be vacuous
- GraphQL query files in `src/lib/queries/` — mostly static strings; not worth testing unless they contain parameterisation logic
- API endpoint files that are thin glue code

### E2E gaps to consider
E2E tests should cover **user-observable functionality** — things that require real browser behaviour, navigation, network calls, or cross-component interaction that can't be faked in a unit test. Do NOT add an e2e test just to assert something is "visible" — that's a unit-test concern.

Existing e2e coverage: smoke, search, maps, post-pages, comment-form, guessthescore.

Ask: is there a **functional user flow** that isn't covered? For example:
- A multi-step interaction that changes application state
- A navigation flow that requires real routing
- A feature that relies on real API mocking at the network level

If the gap is purely "logic in a function", pick unit. If the gap is "a user can do X and the page responds correctly in a way that requires real browser state", pick e2e.

---

## Step 3 — Decide

Pick **one** of:

A. A **unit test** for the highest-value untested file  
B. An **e2e test** for a real functional gap  
C. **Report** that no improvement is justified right now (explain why)

Choose A or B only if the test would catch real bugs. Prefer A when the logic is self-contained. Prefer B when the behaviour requires real browser interaction or cross-component state.

If you choose C, explain clearly what you evaluated, why each candidate was rejected, and what you'd watch for in future.

---

## Step 4 — Write the test

### Unit test rules
- Match the existing Vitest patterns: `describe`/`test`/`it`, `vi.mock()` for dependencies, `beforeEach` for reset
- Use `happy-dom` environment if DOM is needed (check vitest.config.ts — default is `node`)
- Do NOT add `// @vitest-environment happy-dom` unless the code requires DOM APIs
- File goes alongside the source file: `src/lib/foo.ts` → `src/lib/foo.test.ts`
- Keep it focused: test the interesting logic paths, not every getter

### E2e test rules
- Match existing Playwright patterns: `test`, `page.goto()`, `page.getByRole()`, `page.route()` for API mocking
- Cover **functionality** — user actions that change state, trigger network calls, or navigate — not just visibility
- File goes in `tests/e2e/` with a `.spec.ts` suffix
- Use the existing `baseURL` (http://localhost:4321) — no hardcoded URLs

### Style rules (both)
- No comments explaining what the test does — the test name does that
- Descriptive test names: `"returns sorted list by score descending"` not `"test sort"`
- Follow exactly the same import style as sibling test files

---

## Step 5 — Verify

After writing the test:

1. Run `yarn test --reporter=verbose 2>&1` (for unit) or confirm the e2e file is syntactically valid
2. If the unit tests fail, fix them — do NOT leave a failing test
3. Report back:
   - What you chose (unit or e2e) and why
   - Which file you created/modified
   - What the test covers and what bug it would catch
   - The final test count vs before

If tests pass, you're done. If the e2e test can't be run (no dev server), note that but confirm the file is syntactically correct.
