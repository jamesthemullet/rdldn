---
description: Incrementally improve code quality — picks one issue from a rotating category and fixes it, opens a PR, then reports the finding.
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash
  - mcp__github__create_pull_request
  - mcp__github__create_branch
---

You are running an incremental code quality improvement session for the **rdldn** (Roast Dinners in London) Astro / React / TypeScript project.

## Stack

- **Framework**: Astro 6 with React 19 islands for interactivity
- **TypeScript**: Strict mode via `astro/tsconfigs/strict` (`strict: true`, `noImplicitAny: true`)
- **Styling**: Plain CSS files in `src/styles/`; component-scoped `<style>` blocks in `.astro` files — **no Emotion, no Tailwind**
- **State**: Local hooks only. The one non-trivial case is `src/components/sort-posts/useSortFilter.tsx` — a custom hook using `useReducer` for filter state
- **Source files**: `src/components/`, `src/lib/`, `src/pages/`, `src/layouts/`
- **Linter**: Biome (`biome.json`) — not ESLint
- **Tests**: Vitest (unit) + Playwright (e2e)
- **Unused-dep checker**: Knip (`knip.json`) — has an `ignoreDependencies` list; do not flag those as dead code

---

## What to do each invocation

### Step 1 — Pick a category

Use the current second of the clock (or any arbitrary entropy) to pick **one** of these four categories. Rotate — do not always pick the same one:

1. **Strict typing** — look for: explicit `any`, unsafe `as Type` casts, missing return type annotations on exported functions, non-null assertions (`!`) that could be replaced with proper guards, params typed as `object` or `{}`
2. **Code duplication** — look for: repeated logic across `src/lib/` files, identical GraphQL fetch patterns that should share a helper, values inlined 3+ times that should be a named constant
3. **Bad patterns** — look for: `useEffect` with missing or overly broad dependency arrays, magic numbers/strings, large inline functions that obscure intent, inline `style=` props in `.tsx` files (should be CSS classes)
4. **Dead code** — look for: exported symbols not imported anywhere in the project, commented-out code blocks left in files

### Step 2 — Find the best candidate

Read the relevant source files. Focus on:
- `src/components/sort-posts/useSortFilter.tsx` — complex hook, rich hunting ground
- `src/lib/` — utility and data-fetching functions
- `src/components/` — React `.tsx` island components
- `src/layouts/` — layout wrappers

Identify the **single clearest, most impactful** instance of the chosen category. Prefer issues that:
- Are in frequently-used files
- Have an unambiguous fix
- Won't require changes across many files

### Step 3 — Fix it

Make the fix. Keep scope tight — one issue, one or two files. Do not refactor beyond what is needed to address the specific finding.

### Step 4 — Type-check (if types changed)

If the fix touched any TypeScript types (added/changed/removed type annotations, interfaces, generics, or imports from type-only files), run:

```
yarn tsc --noEmit 2>&1 | head -50
```

Fix every reported error before proceeding. Re-run until the output is clean.

### Step 5 — Verify

Run `yarn build 2>&1 | tail -20` to confirm TypeScript still compiles cleanly after the change. If it fails, fix the compilation error before reporting.

### Step 6 — Commit, push, and open a PR

1. Create a new branch named `quality/<short-slug>` (e.g. `quality/remove-isSaved-bang`):
   ```
   git checkout -b quality/<short-slug>
   ```
2. Stage only the files you changed and commit:
   ```
   git add <file1> [<file2>]
   git commit -m "<concise imperative message>\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
   ```
3. Push the branch:
   ```
   git push -u origin quality/<short-slug>
   ```
4. Open a PR using `mcp__github__create_pull_request` targeting `main`. Title should be concise (≤ 70 chars). Body should follow this template:
   ```
   ## Summary
   - <what was changed and why>

   ## Category
   <chosen quality category>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

### Step 7 — Report

Output exactly this structure:

```
## Quality improvement

**Category:** <chosen category name>
**File:** <path:line>
**Issue:** <one sentence describing the problem>
**Fix:** <what was changed and why>
**Next suggestion:** <the next candidate worth tackling in this category, with file path>
```

---

## Known project patterns

- **Styling**: CSS is the right answer — inline `style=` props in `.tsx` files are a smell
- **No global state**: There is no app-wide context; all state lives in hooks. Prop drilling in React islands is acceptable when shallow
- **`useSortFilter` hook**: Business logic for sorting/filtering belongs here, not scattered in the component that calls it
- **GraphQL queries**: Live as static strings in `src/lib/queries/` — parameterisation helpers belong in `src/lib/graphql.ts`
- **Knip ignore list**: Check `knip.json` `ignoreDependencies` before flagging anything as unused
- **`src/utils/` does not exist**: Utilities live in `src/lib/`
- **Astro `.astro` files**: TypeScript in frontmatter (`---` blocks) is also in scope for typing issues
