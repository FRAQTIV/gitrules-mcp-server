# Claude Code Integration Guide

## Overview

Claude Code has built-in MCP support but requires explicit workflow configuration to use git rules effectively. This guide covers the setup and important caveats.

## Quick Setup

### 1. Install the MCP Server

```bash
npm install -g @fraqtiv/git-rules-mcp
```

### 2. Configure Claude Code

Add to your `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "git-rules": {
      "command": "mcp-git-rules"
    }
  }
}
```

### 3. Restart Claude Code

The MCP server will be available after restarting Claude Code.

## Important Caveats

### ⚠️ Manual Workflow Required

**Key Limitation**: Claude Code does NOT automatically consult MCP servers before git operations. The MCP server provides tools that Claude can choose to use, but doesn't intercept git commands.

**What This Means**:
- MCP server won't automatically block invalid git operations
- Claude must be explicitly instructed to validate commands
- Requires proper workflow documentation in your project

### ✅ Solution: Project-Level Workflow

Add this to your project's `CLAUDE.md` or similar instruction file:

```markdown
## MANDATORY Git Workflow

**CRITICAL: Claude MUST follow this workflow for ALL git operations.**

### Before ANY Git Command

1. **ALWAYS check repository status:**
   ```
   Use: mcp__gitrules-mcp-server__get_repository_status
   ```

2. **ALWAYS validate the git command:**
   ```
   Use: mcp__gitrules-mcp-server__validate_git_command
   Parameters: command, args (if applicable)
   ```

3. **Only proceed if validation passes. If blocked, follow suggested workflow.**

### Error Response Protocol

If a git command is blocked:
1. Show the user the validation error message
2. Show the suggested workflow
3. Ask for permission before proceeding with alternative workflow
4. Never bypass the rules - always follow the suggested path

**This workflow is MANDATORY and cannot be overridden.**
```

## Available MCP Tools

### Repository Status
```
mcp__gitrules-mcp-server__get_repository_status
```
Returns current branch, protection status, cleanliness, and modified files.

### Command Validation
```
mcp__gitrules-mcp-server__validate_git_command
Parameters:
  - command: "push", "commit", "merge"
  - args: ["origin", "main"] (optional)
```
Returns whether command is allowed, with error messages and suggestions.

### Workflow Suggestions
```
mcp__gitrules-mcp-server__suggest_workflow
Parameters:
  - task: "start_feature", "merge_feature", "promote_to_main", "hotfix"
```
Returns step-by-step workflow commands.

### Repository Compliance
```
mcp__gitrules-mcp-server__analyze_repository_compliance
```
Analyzes repository for workflow violations.

## Example Workflow

### Starting New Feature
```
1. Check status: mcp__gitrules-mcp-server__get_repository_status
2. Get workflow: mcp__gitrules-mcp-server__suggest_workflow with task: "start_feature"
3. Follow suggested commands exactly
```

### Before Committing
```
1. Validate: mcp__gitrules-mcp-server__validate_git_command with "commit"
2. If allowed, proceed with conventional commit format
3. If blocked, follow suggested workflow
```

### Before Pushing
```
1. Validate: mcp__gitrules-mcp-server__validate_git_command with "push"
2. If allowed, proceed
3. If blocked, follow suggested workflow (usually: merge to dev first, then PR)
```

## Troubleshooting

### MCP Server Not Available
- Check `~/.claude/claude_desktop_config.json` configuration
- Ensure `@fraqtiv/git-rules-mcp` is installed globally
- Restart Claude Code completely
- Check Claude Code logs for MCP connection errors

### Rules Not Being Enforced
- **This is expected behavior** - MCP doesn't automatically intercept git commands
- Add explicit workflow instructions to your project's `CLAUDE.md`
- Train Claude to always validate before git operations

### Context Overload
- Keep project instruction files concise
- Use multiple specific MCP calls rather than single complex ones
- Clear context periodically with `/clear` command

## Best Practices

### 1. Explicit Workflow Documentation
Always document the required MCP validation workflow in your project files.

### 2. Consistent Validation
Make validation a habit - validate every git operation before execution.

### 3. Follow Suggestions
When MCP blocks an operation, always follow the suggested alternative workflow.

### 4. Regular Compliance Checks
Use `analyze_repository_compliance` to catch workflow violations early.

## Configuration File

Create `.gitrules.yaml` in your project root:

```yaml
# Protected branches
protectedBranches:
  - main

# Integration branch  
integrationBranch: dev

# Branch prefixes
featureBranchPrefix: feature/
hotfixBranchPrefix: hotfix/

# Workflow rules
requireCleanWorkingTree: true
allowDirectPush: false
enforceCommitMessageFormat: true

# Allowed commit types
allowedCommitTypes:
  - feat
  - fix
  - docs
  - style
  - refactor
  - test
  - chore
```

## Need Help?

- [Main Documentation](../README.md)
- [Configuration Reference](./configuration.md)
- [GitHub Issues](https://github.com/FRAQTIV/gitrules-mcp-server/issues)