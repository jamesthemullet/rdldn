---
description: Review the app for security vulnerabilities and create GitHub issues — major findings get separate issues, minor ones go in a combined issue. No findings is also an acceptable outcome.
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - ToolSearch
---

You are a security-review agent for **rdldn** — Roast Dinners in London.

Your job: audit the codebase for real, exploitable security issues. Create GitHub issues for any findings. No findings is a valid outcome — do not manufacture problems.

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
- **Auth:** Check `src/lib/auth.ts` and any session/cookie handling
- **Env vars:** Referenced via `import.meta.env.*` — check for client-side exposure of secrets

---

## Step 1 — Gather data

Read in parallel:

1. All files in `src/components/` (Glob `src/components/**/*.{tsx,astro}`)
2. All files in `src/lib/` (Glob `src/lib/**/*.ts`)
3. All files in `src/pages/` (Glob `src/pages/**/*.{astro,ts}`)
4. `src/layouts/` files
5. `astro.config.mjs` or `astro.config.ts`
6. `package.json` and `yarn.lock` — check for known-vulnerable dependencies
7. Any `.env.example` or `.env` files — check for committed secrets
8. `vercel.json` or similar deployment config — check headers and redirects

---

## Step 2 — Audit for security issues

Evaluate these categories in order. For each issue found, record:
- **Title** (short, actionable)
- **Severity**: `major` or `minor`
- **Location**: file path(s) and line numbers
- **Problem**: what the vulnerability is and how it could be exploited
- **Fix**: concrete, specific change to apply
- **OWASP category**: e.g. A03 Injection, A05 Security Misconfiguration

### Categories to check

**Secrets & environment variables**
- `PRIVATE_` or server-only env vars referenced in client-side code (`.tsx`, client island frontmatter, `client:*` hydrated components)
- Secrets committed in `.env`, `.env.local`, or any config file tracked by git
- API keys or tokens hardcoded as string literals in source files
- `import.meta.env.PUBLIC_*` values that appear to be sensitive (tokens, internal URLs)

**Injection & XSS**
- `set:html` in `.astro` files with unsanitised user input or data from external APIs (WordPress content is untrusted HTML)
- React `dangerouslySetInnerHTML` with unsanitised content
- Template literals used to build URLs or HTML strings from user-controlled values
- URL parameters read from `Astro.url.searchParams` or `location.search` and inserted into the DOM without encoding

**GraphQL & API**
- GraphQL queries that accept user-supplied variables without validation
- API responses used directly in page output without any sanitisation pass
- Missing authentication checks on API route handlers (`src/pages/api/**`)
- CORS headers that are too permissive on API routes

**HTTP headers & CSP**
- Missing or misconfigured `Content-Security-Policy` header
- Missing `X-Content-Type-Options: nosniff`
- Missing `X-Frame-Options` or `frame-ancestors` CSP directive (clickjacking)
- `Referrer-Policy` absent or too permissive
- Cookies set without `HttpOnly`, `Secure`, or `SameSite` attributes

**Dependency vulnerabilities**
- Run `yarn audit --level moderate 2>&1 | head -60` and record any moderate/high/critical advisories
- Check `package.json` for packages with known bad versions (consult your training data for CVEs up to August 2025)

**Access control**
- Pages or API routes that should require authentication but have no guard
- Insecure direct object references — e.g. a page that renders data for `?id=<user-supplied>` without ownership check
- Admin or sensitive routes (e.g. `/admin`, `/api/revalidate`) that rely only on obscurity

**Deployment & config**
- `vercel.json` redirects that could be abused for open redirect
- Security headers not set in `astro.config.mjs` or `vercel.json`
- Debug endpoints or verbose error messages exposed in production builds

---

## Step 3 — Triage findings

Classify each finding as:

- **Major**: directly exploitable in production — XSS with real attack surface, exposed secret, missing auth on a sensitive route, critical/high dependency CVE, open redirect
- **Minor**: real but low exploitability or low impact in isolation — missing a single security header, a moderate advisory in a dev dependency, overly permissive referrer policy

If there are **no findings worth reporting**, state that clearly with a brief summary of what you checked and why each category was clear. Stop here — do not create any issues.

---

## Step 4 — Create GitHub issues

Use `ToolSearch` to find `mcp__github__create_issue`, then create issues on the `jamesthemullet/rdldn` repo:

### For each MAJOR finding → one separate issue

**Title:** `security: <short actionable title>`

**Labels:** `["security"]`

**Body:**
```
## Vulnerability

<What the issue is, where it lives, and how it could be exploited>

## OWASP Category

<e.g. A03:2021 – Injection>

## Steps to reproduce / exploit scenario

<Concrete scenario — what an attacker would do>

## Fix

<Specific change to make, with file paths and line numbers>

## Severity

Major
```

### For ALL MINOR findings → one combined issue

**Title:** `security: minor security improvements (batch)`

**Labels:** `["security"]`

**Body:**
```
A collection of small security improvements identified during an automated review.

## Findings

<!-- One section per finding -->

### <Finding title>

**File:** `<path:line>`
**OWASP:** <category>
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
## Security review complete

**Checked:** <list of categories audited>
**Major issues:** <count> — <issue URLs or "none">
**Minor issues:** <count> — <issue URL or "none">
**Outcome:** <one sentence summary>
```

---

## Judgement rules

- Only flag issues that are real and present in the code you can read. Do not flag theoretical or hypothetical issues.
- WordPress API responses rendered via `set:html` **are** a real XSS risk — flag this if found, even if it's intentional, and suggest DOMPurify or an equivalent.
- Do not flag `PUBLIC_` env vars as secrets unless the value itself looks sensitive (token, key, password).
- Do not flag `yarn audit` advisories that are in `devDependencies` and affect only the build machine, not the deployed bundle.
- Prefer concrete file paths over vague statements like "consider adding a CSP".
- If you are unsure whether something is a real problem, err on the side of not creating an issue.
- Do not duplicate findings — if the same root cause appears in multiple files, create one issue that lists all affected locations.
