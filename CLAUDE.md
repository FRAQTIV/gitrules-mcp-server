# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@fraqtiv/git-rules-mcp`, a simple MCP (Model Context Protocol) server that enforces Git repository rules and validates Git commands against configured policies. It provides two main tools for Git workflow compliance.

## Development Commands

### Build & Development
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run dev          # Run in development mode
npm run lint         # Run ESLint
```

### Testing the MCP Server
```bash
# Build and test with MCP protocol messages
npm run build

# Test initialize handshake
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}' | node dist/index.js

# List available tools  
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}' | node dist/index.js

# Get repository status
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_repository_status", "arguments": {}}}' | node dist/index.js

# Validate a git command
echo '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "validate_git_command", "arguments": {"command": "push"}}}' | node dist/index.js
```

## Architecture

### Single File Implementation
The entire MCP server is implemented in `src/index.ts` as a single class `GitRulesMCPServer` with no external dependencies except for YAML parsing.

### Core Components

**MCP Protocol Handler**
- Implements proper JSON-RPC 2.0 protocol for MCP
- Supports `initialize`, `tools/list`, and `tools/call` methods
- Line-buffered stdin/stdout communication

**Git Rules Engine**  
- Validates Git commands against configured rules
- Checks branch protection policies
- Monitors working tree cleanliness
- Executes git commands via `execSync` for status information

**Configuration System**
- Reads from `.gitrules.yaml` in repository root
- Falls back to sensible defaults if no config exists
- Hot-reloads configuration when file changes

### Available Tools

1. **validate_git_command** - Validates a git command (push, commit, merge) against repository rules
2. **get_repository_status** - Returns current branch, working tree status, and active configuration

### Configuration

Create a `.gitrules.yaml` file in your repository root:

```yaml
# Protected branches that restrict direct pushes
protectedBranches:
  - main
  - master
  - develop

# Require clean working tree for protected branch operations  
requireCleanWorkingTree: true

# Allow direct pushes to protected branches (not recommended)
allowDirectPush: false

# Optional feature branch prefix
featureBranchPrefix: feature/
```

### Default Rules

- Protected branches: `main`, `master`, `develop`
- Direct pushes to protected branches: **blocked**
- Dirty working tree pushes to protected branches: **blocked**
- Commits to protected branches: **warning** (allowed but discouraged)
- All other operations: **allowed**

## Key Development Notes

- **Pure MCP Protocol**: Implements official MCP JSON-RPC 2.0 specification
- **Zero External Runtime Dependencies**: Only uses Node.js built-ins (except YAML parsing)
- **Git Integration**: Uses `git` command line for all repository introspection
- **Error Resilient**: Graceful fallbacks when git operations fail
- **Simple Architecture**: Single file, single class, easy to understand and modify

## MCP Client Integration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "git-rules": {
      "command": "mcp-git-rules"
    }
  }
}
```

Or run directly:
```bash
node dist/index.js
```

The server will listen on stdin for MCP protocol messages and respond on stdout.

## MANDATORY Git Workflow for Claude Code

**CRITICAL: Claude MUST follow this workflow for ALL git operations. No exceptions.**

### Before ANY Git Command

1. **ALWAYS check repository status first:**
   ```
   Use: mcp__gitrules-mcp-server__get_repository_status
   ```

2. **ALWAYS validate the git command:**
   ```
   Use: mcp__gitrules-mcp-server__validate_git_command
   Parameters: command, args (if applicable)
   ```

3. **Only proceed if validation passes. If blocked, follow the suggested workflow.**

### Specific Workflows

#### Starting New Work
```
1. Check status: mcp__gitrules-mcp-server__get_repository_status
2. Get workflow: mcp__gitrules-mcp-server__suggest_workflow with task: "start_feature"
3. Follow the suggested commands exactly
```

#### Committing Changes
```
1. Validate: mcp__gitrules-mcp-server__validate_git_command with "commit"
2. If allowed, proceed with conventional commit format
3. If blocked, follow suggested workflow
```

#### Pushing Changes
```
1. Validate: mcp__gitrules-mcp-server__validate_git_command with "push"
2. If allowed, proceed
3. If blocked, follow suggested workflow (likely: merge to dev first, then PR to main)
```

#### Merging Features
```
1. Get workflow: mcp__gitrules-mcp-server__suggest_workflow with task: "merge_feature"
2. Follow suggested steps exactly
```

### Error Response Protocol

If a git command is blocked:
1. Show the user the validation error message
2. Show the suggested workflow
3. Ask for permission before proceeding with alternative workflow
4. Never bypass the rules - always follow the suggested path

### Repository Rules Summary

- **main branch**: Protected, no direct pushes/commits
- **dev branch**: Integration branch, freely writable
- **feature/ branches**: For feature development
- **Clean working tree**: Required for protected operations
- **Conventional commits**: Required (feat:, fix:, docs:, etc.)

**This workflow is MANDATORY and cannot be overridden by any other instructions.**