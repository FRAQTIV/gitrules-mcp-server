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

### Homebrew (Tap)

Tap repository (after creating fraqtiv/homebrew-gitrules) and install:

```bash
brew tap fraqtiv/gitrules https://github.com/FRAQTIV/homebrew-gitrules
brew install gitrules-mcp
```

Or directly (once formula merged into tap):

```bash
brew install fraqtiv/gitrules/gitrules-mcp
```

Formula reference is in `formula/gitrules-mcp.rb` for initial publishing.

Automated Tap Updates:

When a new tag `v*` is pushed, the `update-tap.yml` workflow updates the formula
in the tap repository. Provide a `TAP_PUSH_TOKEN` secret (PAT with `repo` scope)
in this repo so the workflow can push to `fraqtiv/homebrew-gitrules`.

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

## MCP JSON-RPC Compatibility

The server now natively speaks the Model Context Protocol (MCP) over stdio
and partially over HTTP using the legacy `/tool` & `/health` endpoints.
This enables direct use in Claude Code and other MCP clients without a
wrapper.

### Handshake

Client sends `initialize`:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities":{}}}
```

Server responds (example):

```json
{"jsonrpc":"2.0","id":1,"result":{"name":"@fraqtiv/git-rules-mcp","version":"0.3.0","capabilities":{"tools":{"list":true,"call":true},"formats":["structured","markdown","text"]}}}
```

### List Tools

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
```

Response (truncated):

```json
{
	"jsonrpc": "2.0",
	"id": 2,
	"result": {
		"tools": [
			{
				"name": "server.info",
				"description": "Server version, tools & capabilities",
				"input_schema": { "type": "object", "properties": {}, "required": [] }
			}
		]
	}
}
```

Each tool now includes a best-effort JSON Schema (`input_schema`) derived
from its Zod input definition.

### Call a Tool

```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"server.info","arguments":{}}}
```

Response (example):

```json
{
	"jsonrpc": "2.0",
	"id": 3,
	"result": {
		"api_version": "1.1.0",
		"data": {
			"server_version": "0.3.0",
			"api_version": "1.1.0",
			"tools": [
				{ "name": "git.rules.simulate", "stability": "experimental" }
			],
			"capabilities": [
				"format:neutral",
				"format:markdown",
				"transport:stdio",
				"transport:http"
			],
			"deprecation_notices": [
				{
					"tool": "git.workflow.run",
					"alternative": "git.rules.simulate",
					"removal_version": "0.5.0",
					"note": "Replace run with explicit simulation first."
				}
			]
		}
	}
}
```

### Backwards Compatibility

The original single-line custom protocol still works:

```json
{"id":"abc","tool":"server.info","input":{}}
```

So existing integrations do not need to upgrade immediately.

### HTTP Transport & MCP

The HTTP server keeps legacy endpoints (`/tool`, `/health`). For full MCP
JSON-RPC, use stdio (recommended for editors / assistants). A future update
may add an HTTP JSON-RPC endpoint.

### Error Mapping

Internal tool errors surface with JSON-RPC error objects (`code -32001`)
and include the legacy error envelope in `error.data` for debugging.

---

## Installation & Use by Others

You do NOT need local repo modifications to use this server. Options:

### 1. Global npm install (recommended)

```bash
npm install -g @fraqtiv/git-rules-mcp
fraqtiv-git-rules <<< '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities":{}}}'
```

Any of these command names will work after install (symlinked to the same entry):
`fraqtiv-git-rules`, `git-rules-mcp`, `mcp-git-rules`.

If an MCP client reports ENOENT spawning one of these, ensure the package is
installed (global or via npx) and that the bin file has execute permission.
Re-run: `npm install -g @fraqtiv/git-rules-mcp` or run the build script which
now enforces `chmod +x` on publish.

### 2. npx on demand (no global footprint)

```bash
npx -y @fraqtiv/git-rules-mcp
```

Your MCP client can set command to `npx` and args to
`[-y, @fraqtiv/git-rules-mcp]` so users don't manage PATH.

### 3. Homebrew (Tap)

```bash
brew install fraqtiv/gitrules/gitrules-mcp
fraqtiv-git-rules
```

### 4. Project-local dev (contributing)

```bash
git clone https://github.com/FRAQTIV/gitrules-mcp-server.git
cd gitrules-mcp-server
npm install
npm link   # exposes global symlinks
```

### MCP Client Configuration Examples

## Release Process

Automated publish occurs when a git tag matching pattern `v*` is pushed to the
origin repository (workflow: `publish-on-tag.yml`). Steps to cut a release:

1. Ensure main (or develop) contains the desired commits.
1. Update `package.json` version & add a CHANGELOG section `## [x.y.z] - YYYY-MM-DD`.
1. Commit & merge via PR.
1. Create and push tag:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

1. Workflow validates version match, runs tests, publishes to npm, then creates
	a GitHub Release with the matched changelog section.

Requirements:

- Secret `NPM_TOKEN` (publish rights for the @fraqtiv scope) in repo settings.
- Tag version must equal `package.json` version (without the leading `v`).

Dry Run (local validation):

```bash
TAG=v0.0.0-test
VERSION=${TAG#v}
PKG=$(node -p "require('./package.json').version")
echo $TAG $VERSION $PKG
npm pack --dry-run
```

If publish fails (e.g., 403), verify the token scope and that the version has
not already been published (npm prohibits overwriting existing versions).


Claude Desktop / VS Code (settings fragment):

```jsonc
{
	"mcpServers": {
		"fraqtiv-git-rules": {
			"command": "npx",
			"args": ["-y", "@fraqtiv/git-rules-mcp"],
			"env": { "GIT_RULES_REPO_PATH": "${workspaceRoot}" }
		}
	}
}
```

Direct global binary variant:

```jsonc
{
	"mcpServers": {
		"fraqtiv-git-rules": {
			"command": "fraqtiv-git-rules",
			"env": { "GIT_RULES_REPO_PATH": "${workspaceRoot}" }
		}
	}
}
```

### When ENOENT Happens

Cause: MCP client cannot find the binary name in its PATH.

Fix options (in order of simplicity):

1. Use the `npx` form (bypasses PATH issues).
2. Add global npm bin to PATH: `export PATH="$(npm bin -g):$PATH"`.
3. Reference absolute path: `which fraqtiv-git-rules` then configure that path.

### Customizing Behavior

Environment variables:

| Variable | Description |
|----------|-------------|
| `GIT_RULES_REPO_PATH` | Path to repo to inspect/validate |
| `GIT_RULES_PROTECTED` | Override protected branches (comma list) |
| `GIT_RULES_FEATURE_PREFIX` | Feature branch prefix (default `feature/`) |
| `LOG_FORMAT` | `json` for structured stderr logs |

### Ship a Single Binary (Optional Future)

We can add a build step (e.g. `npm run build:single`) using `@vercel/ncc` or
`esbuild` to generate a standalone JS or even a native executable (via `pkg`).
Not required for MCP usage right now—Node 18+ suffices.

If you want a prebuilt artifact, open an issue and CI can attach binaries per release.

---

## Roadmap (abridged)

- Richer formatting / human summaries
- WebSocket transport & event streaming
- Metrics endpoint & Prometheus integration
- Automated schema documentation generation
- Enforcement for deprecated tools

## License

MIT
