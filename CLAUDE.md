# Claude Code Guidelines

## GitHub Integration

**Do NOT use `gh` CLI or `hub` CLI** — they are not installed in this environment.

For all GitHub interactions (viewing PRs, creating PRs, posting comments, checking CI, browsing the repo), use the **GitHub MCP server tools** exclusively. These are functions prefixed with `mcp__github__`, for example:

- `mcp__github__create_pull_request` — create a pull request
- `mcp__github__list_pull_requests` — list pull requests
- `mcp__github__get_pull_request` — get PR details
- `mcp__github__create_issue` — create an issue
- `mcp__github__list_commits` — list commits

Use `ToolSearch` to discover the full set of available `mcp__github__` tools if needed.
