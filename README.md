# @fraqtiv/git-rules-mcp

Assistant-agnostic MCP server exposing Git rules & workflow helpers.

## Tools (API v1.1.0)

| Tool | Stability | Description |
|------|-----------|-------------|
| server.info | stable | Server version, tools, capabilities, deprecations |
| server.health | stable | Health checks & metrics snapshot |
| git.rules.validate | stable | Validate a git command against policy |
| git.rules.status | stable | Current repository status summary |
| git.rules.simulate | stable | Dry-run a sequence of git commands vs policy |
| server.config | stable | Read/update `.gitrules.yaml` config |
| git.workflow.suggest | stable | Suggest steps for a workflow task |
| git.workflow.run | deprecated (experimental) | Deprecated workflow stub |

### Response Envelope

All successes: `{ api_version, data, human?, meta? }`

Errors: `{ api_version, error: { code, message, hint?, remediation? }, human? }`

### Versioning

- `api_version` follows semver: breaking => major.
- New tools / fields => minor.

### Example (stdio line protocol)

```json
{"id":"1","tool":"server.info","input":{}}
```

Response (truncated example):

```json
{"id":"1","result":{"api_version":"1.1.0","data":{"server_version":"0.3.0","api_version":"1.1.0","tools":[{"name":"server.info","stability":"stable"},
 {"name":"server.config","stability":"stable"}],"capabilities":["format:neutral",
 "format:markdown","transport:stdio","transport:http"]}}}
```

## Quick Start

Install (from npm) & build locally:

```bash
npm install
npm run build
node dist/index.js # demo prints server.info (stdio transport)
node dist/index.js --transport=http --port=3030 & # start HTTP server
curl -s localhost:3030/health | jq
```

Use installed binary (after npm i -g or via npx):

```bash
 npx @fraqtiv/git-rules-mcp --transport=http --port=3030
```

Environment variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| GIT_RULES_PROTECTED | Comma list of protected branches | main,dev,develop |
| GIT_RULES_FEATURE_PREFIX | Feature branch prefix | feature/ |
| GIT_RULES_REPO_PATH | Path to git repo to inspect | process.cwd() |
| MCP_AUTH_TOKEN | Bearer token required for HTTP auth | (none) |
| MCP_CORS_ORIGIN | CORS allow origin | * |
| LOG_FORMAT | Set to `json` for structured logs | (plain) |

Embed in an MCP-enabled assistant via executable: `mcp-git-rules`.

## Roadmap (abridged)

- Richer formatting / human summaries
- WebSocket transport & event streaming
- Metrics endpoint & Prometheus integration
- Automated schema documentation generation
- Enforcement for deprecated tools

## License

MIT
