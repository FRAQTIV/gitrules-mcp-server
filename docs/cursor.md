# Cursor IDE Integration Guide

## Overview

Cursor IDE supports MCP servers through its extension system and AI integration. This guide covers setup and best practices for using git rules with Cursor's AI features.

## Quick Setup

### 1. Install the MCP Server

```bash
npm install -g @fraqtiv/git-rules-mcp
```

### 2. Configure Cursor

#### Option A: Global Configuration
Add to your Cursor settings (`~/.cursor/config.json`):

```json
{
  "mcp": {
    "servers": {
      "git-rules": {
        "command": "mcp-git-rules",
        "args": []
      }
    }
  }
}
```

#### Option B: Project Configuration
Create `.cursor/config.json` in your project root:

```json
{
  "mcp": {
    "servers": {
      "git-rules": {
        "command": "mcp-git-rules",
        "args": [],
        "cwd": ".",
        "autoStart": true
      }
    }
  }
}
```

### 3. Configure AI Rules

Add to your `.cursorrules` file:

```
# Git Workflow Rules

When performing ANY git operation:

1. ALWAYS use the git-rules MCP server to validate commands
2. Use `get_repository_status` to check current state
3. Use `validate_git_command` before executing any git command
4. If blocked, follow the suggested workflow from the MCP server
5. Never bypass git rules - always follow alternative workflows

## MCP Commands

- get_repository_status: Check branch status and cleanliness
- validate_git_command: Validate before executing git commands  
- suggest_workflow: Get step-by-step workflow guidance
- analyze_repository_compliance: Check for rule violations

## Repository Rules

- Protected branches: main (no direct pushes/commits)
- Integration branch: dev (merge features here first)
- Feature branches: feature/ prefix required
- Commit format: conventional commits (feat:, fix:, docs:, etc.)
- Clean working tree required for protected operations
```

## Integration Features

### Cursor Composer Integration

When using Cursor's Composer feature:

1. **Pre-commit Validation**: Configure Composer to validate commits before applying changes
2. **Branch Awareness**: Composer will respect branch protection rules
3. **Workflow Integration**: Use MCP suggestions within Composer workflows

### AI Chat Integration

In Cursor's AI chat:

```
@git-rules validate push origin main
@git-rules suggest workflow for starting new feature
@git-rules check repository compliance
```

### Command Palette

Access MCP tools via Cursor's command palette:
- `Ctrl+Shift+P` → "MCP: Git Rules"
- Quick access to repository status and validation

## Workflow Examples

### Starting New Development

```typescript
// In Cursor AI chat
"I want to start working on a new user authentication feature. 
Please check repository status and guide me through the proper workflow."

// AI will use MCP to:
// 1. Check current repository status
// 2. Suggest proper branch creation workflow
// 3. Validate each step before execution
```

### Before Committing Changes

```typescript
// Cursor can automatically validate before commits
"I've made changes to the authentication system. 
Please validate that I can commit these changes safely."

// AI will:
// 1. Check working tree status
// 2. Validate commit command
// 3. Ensure proper commit message format
// 4. Suggest alternative if blocked
```

### Code Review Integration

Configure Cursor to use MCP during code reviews:

```json
{
  "review": {
    "preCommitHooks": ["mcp-git-rules-validate"],
    "workflowValidation": true
  }
}
```

## Advanced Configuration

### Environment Variables

Set environment variables for enhanced integration:

```bash
export MCP_GIT_RULES_CONFIG=".gitrules.yaml"
export MCP_GIT_RULES_STRICT_MODE=true
export MCP_GIT_RULES_AUTO_SUGGEST=true
```

### Custom Workflows

Create project-specific workflows in `.cursor/workflows.json`:

```json
{
  "workflows": {
    "safe-commit": [
      {
        "name": "Validate Repository State",
        "mcp": "git-rules",
        "tool": "get_repository_status"
      },
      {
        "name": "Validate Commit",
        "mcp": "git-rules", 
        "tool": "validate_git_command",
        "args": ["commit"]
      },
      {
        "name": "Execute Commit",
        "condition": "validated",
        "command": "git commit"
      }
    ]
  }
}
```

## VS Code Compatibility

Since Cursor is based on VS Code, most VS Code MCP extensions work:

### Recommended Extensions

1. **MCP Client** - Direct MCP server communication
2. **Git Rules Helper** - UI for common git rule operations
3. **Workflow Validator** - Pre-commit validation

### Extension Configuration

Add to `settings.json`:

```json
{
  "mcp.servers": {
    "git-rules": {
      "command": "mcp-git-rules",
      "autoRestart": true,
      "logging": "info"
    }
  },
  "git.preCommitHook": "mcp-git-rules-validate",
  "git.branchProtection": true
}
```

## Troubleshooting

### MCP Server Connection Issues

```bash
# Test MCP server manually
mcp-git-rules --test

# Check Cursor logs
tail -f ~/.cursor/logs/mcp.log

# Restart MCP services
# Command Palette → "MCP: Restart All Servers"
```

### AI Not Using MCP Tools

1. Check `.cursorrules` configuration
2. Ensure MCP server is registered and running
3. Try explicit MCP commands in AI chat
4. Clear AI context and retry

### Performance Issues

- Use project-level MCP configuration instead of global
- Enable `autoStart: false` for unused servers
- Configure MCP logging level to `error` in production

## Configuration Reference

### Project `.gitrules.yaml`

```yaml
# Repository workflow rules
protectedBranches:
  - main
  - master

integrationBranch: dev
featureBranchPrefix: feature/
hotfixBranchPrefix: hotfix/

# Enforcement settings
requireCleanWorkingTree: true
allowDirectPush: false
enforceCommitMessageFormat: true

# Cursor-specific settings
cursor:
  autoValidate: true
  showSuggestions: true
  strictMode: true
```

### Global Cursor Settings

```json
{
  "mcp": {
    "globalServers": {
      "git-rules": {
        "command": "mcp-git-rules",
        "autoStart": true,
        "timeout": 5000
      }
    }
  },
  "ai": {
    "preferMCP": true,
    "mcpTimeout": 10000
  }
}
```

## Best Practices

### 1. Project-Specific Configuration
Always use project-level `.cursor/config.json` for team consistency.

### 2. AI Training
Include git workflow rules in your `.cursorrules` to train the AI properly.

### 3. Workflow Automation
Use Cursor's workflow features to automate common git rule validation patterns.

### 4. Team Standards
Share MCP configuration and rules across your team via version control.

## Need Help?

- [Main Documentation](../README.md)
- [Cursor Documentation](https://cursor.sh/docs)
- [GitHub Issues](https://github.com/FRAQTIV/gitrules-mcp-server/issues)