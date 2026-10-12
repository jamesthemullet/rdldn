---
name: dependency-update
description: Run `yarn audit`, fix every high/critical vulnerability that has a fix available, then review every entry in package.json `resolutions` and remove any that are no longer needed — finishing with a PR summarising what was and wasn't fixed. Use when the user asks to update dependencies, fix audit/vulnerability warnings, clean up resolutions, or run a dependency/security bump.
---

# Dependency update

Keeps the `rdldn` dependency tree free of high/critical advisories and keeps the
`resolutions` block in `package.json` lean. The project uses **Yarn classic (1.x)** — always
use `yarn`, never `npm`.

## 1. Branch

Start from an up-to-date `main` on a fresh branch:

```bash
git fetch origin && git checkout -b chore/dependency-update-YYYY-MM-DD origin/main
yarn install --frozen-lockfile
```

## 2. Audit

```bash
yarn audit --groups dependencies devDependencies --level high --json > "$SCRATCH/audit-before.json"
yarn audit --level high --summary
```

(`$SCRATCH` = the session scratchpad dir.) Parse the `auditAdvisory` lines to build a list of
unique advisories: package, severity, vulnerable range, `patched_versions`, and the dependency
paths (`findings[].paths`). Ignore moderate/low. Record the before-counts for the PR.

## 3. Fix high/critical issues

For each advisory, try in this order and stop at the first that works:

1. **Direct dependency** — if the vulnerable package is listed in `dependencies` /
   `devDependencies`, `yarn upgrade <pkg>@<patched range>` (or `yarn add` for a major bump,
   checking its changelog for breaking changes first).
2. **Upgrade the parent** — if a newer version of the top-level package that pulls it in
   ships the patched transitive version, upgrade that parent instead.
3. **Refresh the lockfile entry** — if the parent's declared range already allows the patched
   version, removing the stale entry from `yarn.lock` and re-running `yarn install` is enough.
4. **Resolution (last resort)** — add/adjust an entry in `resolutions`, pinned to the lowest
   patched version that satisfies the consumers (prefer `^x.y.z` / `>=x.y.z` matching the style
   already used there). Scope it (`parent/**/pkg`) if only one path needs it or if a global
   override would cross a major version for other consumers.

If `patched_versions` is `<0.0.0` / no fix exists, or the only fix needs a breaking major bump
of a core framework (Astro, React, Clerk, Drizzle), **don't force it** — record it as not fixed
with a short reason.

## 4. Review existing resolutions

For **every** entry already in `resolutions` (not just ones touched above):

1. Remove the entry from `package.json`, run `yarn install`.
2. Check what got resolved: `yarn why <pkg>` and re-run
   `yarn audit --level high --json` filtered to that package.
3. Keep the removal only if the full audit (all severities) has no advisory that wasn't there
   before — a resolution that only suppresses a moderate is still doing its job — **and**
   nothing breaks (see step 5). Otherwise restore the entry exactly as it was.

Do these one at a time so each decision is attributable. Resolutions that exist for a reason
other than security (e.g. a pinned exact version like `"htmlparser2": "10.1.0"` used to dodge a
build/compat issue) — check `git log -S '"<pkg>"' -- package.json` for the commit that added it;
if the reason isn't security, leave it alone unless it's clearly obsolete.

## 5. Verify

After all changes:

```bash
yarn install --frozen-lockfile   # lockfile is consistent
yarn lint:errors
yarn ts-check
yarn test
yarn build
yarn audit --level high --summary
```

If something fails, back out the change that caused it (and record it as not fixed / kept)
rather than patching app code to accommodate a dependency bump — unless the fix is trivial.

## 6. Commit and open a PR

Commit `package.json` and `yarn.lock` only, push, then open a PR against `main` using
`mcp__github__create_pull_request` (do **not** use `gh`). Keep the body brief — a few bullets
per section, no advisory dumps:

```markdown
## Summary
Audit: X high / Y critical before → X high / Y critical after.

## Fixed
- `pkg` → 1.2.3 (critical, via upgrade of `parent`)
- `pkg2` → resolution `^4.5.6` (high)

## Not fixed
- `pkg3` (high) — no patched version available

## Resolutions
- Removed: `foo`, `bar` (no longer needed)
- Kept: `baz` (still required for GHSA-xxxx)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

If there were no high/critical advisories and no resolutions could be removed, don't open an
empty PR — just report that to the user.
