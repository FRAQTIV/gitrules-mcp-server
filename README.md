# @fraqtiv/git-rules-mcp

Assistant-agnostic MCP server exposing Git rules & workflow helpers.

## Tools (API v1.1.0)

| Tool | Stability | Description |
|------|-----------|-------------|
| server.info | stable | Server version, tools, capabilities |
| server.health | stable | Health checks & metrics snapshot |
| git.rules.validate | stable | Validate a git command against policy |
| git.rules.status | stable | Current repository status summary |
| git.workflow.suggest | stable | Suggest steps for a workflow task |
| git.workflow.run | experimental | Execute a workflow (placeholder) |

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

Response:

```json
{"id":"1","result":{"api_version":"1.1.0","data":{"server_version":"0.2.0","api_version":"1.1.0","tools":[{"name":"server.info","stability":"stable"}],"capabilities":["format:neutral","format:markdown","transport:stdio","transport:http"]}}}
```

## Quick Start

Install deps & build:

```bash
npm install
npm run build
node dist/index.js # demo prints server.info
node dist/index.js --transport=http --port=3030 & # start HTTP server
curl -s localhost:3030/health | jq
```

Embed in an MCP-enabled assistant via executable: `mcp-git-rules`.

## Roadmap (abridged)

- Real git introspection
- Config env / file parsing
- HTTP / WS transports
- Policy simulation tool
- Event streaming

## License

MIT
