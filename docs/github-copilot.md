# GitHub Copilot Integration Guide

## Overview

GitHub Copilot doesn't have native MCP support, but you can integrate git rules through VS Code extensions, CLI wrappers, and workflow automation. This guide covers various integration approaches.

## Integration Methods

### Method 1: VS Code Extension Bridge

#### 1. Install MCP Bridge Extension

```bash
# Install the MCP-to-VS-Code bridge extension
code --install-extension mcp-bridge
```

#### 2. Configure VS Code Settings

Add to your `settings.json`:

```json
{
  "mcp-bridge.servers": {
    "git-rules": {
      "command": "mcp-git-rules",
      "autoStart": true
    }
  },
  "github.copilot.enable": {
    "git": true,
    "mcp": true
  }
}
```

#### 3. Enable Copilot Integration

Configure Copilot to use MCP context:

```json
{
  "github.copilot.advanced": {
    "contextProviders": ["mcp-bridge"],
    "gitValidation": true
  }
}
```

### Method 2: CLI Wrapper Approach

#### 1. Create Git Wrapper Script

Create `git-with-rules` script:

```bash
#!/bin/bash
# git-with-rules - Git wrapper with MCP validation

COMMAND=$1
shift
ARGS=$@

# Validate command with MCP server
if command -v mcp-git-rules >/dev/null 2>&1; then
    echo "Validating git $COMMAND..."
    
    # Create temp input for MCP validation
    echo "{\"command\":\"$COMMAND\",\"args\":[\"$ARGS\"]}" | \
    mcp-git-rules validate 2>/dev/null || {
        echo "❌ Git command blocked by rules"
        echo "Run 'mcp-git-rules suggest $COMMAND' for alternatives"
        exit 1
    }
fi

# Execute original git command if validation passes
exec git "$COMMAND" "$ARGS"
```

#### 2. Make Executable and Add to PATH

```bash
chmod +x git-with-rules
sudo cp git-with-rules /usr/local/bin/
```

#### 3. Configure Git Alias

```bash
git config --global alias.safe '!git-with-rules'
```

Now use `git safe push` instead of `git push`.

### Method 3: Pre-commit Hooks

#### 1. Install Git Hooks

```bash
npm install -g @fraqtiv/git-rules-mcp

# Install in your project
cd your-project
mcp-git-rules install-hooks
```

#### 2. Configure Pre-commit Hook

`.git/hooks/pre-commit`:

```bash
#!/bin/sh
# Pre-commit hook with MCP git rules validation

echo "🔍 Validating commit with git rules..."

# Check repository status
STATUS=$(mcp-git-rules get-status 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Failed to get repository status"
    exit 1
fi

# Validate commit
mcp-git-rules validate commit 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Commit blocked by git rules"
    echo "💡 Run 'mcp-git-rules suggest commit' for guidance"
    exit 1
fi

echo "✅ Commit validation passed"
exit 0
```

## GitHub Copilot Chat Integration

### Custom Copilot Instructions

Add to your workspace `.vscode/settings.json`:

```json
{
  "github.copilot.chat.welcomeMessage": [
    "I'll help you with development while following your git workflow rules.",
    "Before any git operations, I'll validate against your repository rules.",
    "Use @git-rules to explicitly check repository compliance."
  ]
}
```

### Chat Commands

Train Copilot with these patterns in your conversations:

```
# Before committing
"Before I commit these changes, please validate that the commit is allowed according to our git rules."

# Before pushing  
"I want to push to main. Please check if this is allowed or suggest the proper workflow."

# Starting new work
"I'm starting a new feature called user-auth. What's the proper branch workflow according to our git rules?"
```

## Workflow Integration

### Copilot Workspace Integration

#### 1. Create Workspace Rules File

`.vscode/copilot-rules.md`:

```markdown
# Git Workflow Rules for Copilot

## Before ANY git operation:
1. Validate the command against repository rules
2. Check current branch and working tree status  
3. Follow suggested workflows if commands are blocked

## Protected Branches
- `main` - No direct commits or pushes
- Only merge via PR from `dev` branch

## Standard Workflow
1. Create feature branch: `git checkout -b feature/name`
2. Work and commit: `git commit -m "feat: description"`  
3. Merge to dev: `git checkout dev && git merge feature/name`
4. Create PR: `dev` → `main`

## Commit Format
Use conventional commits: `type: description`
- feat: New features
- fix: Bug fixes  
- docs: Documentation
- chore: Maintenance

## Validation Commands
- Check status: `mcp-git-rules get-status`
- Validate command: `mcp-git-rules validate <command>`
- Get suggestions: `mcp-git-rules suggest <task>`
```

#### 2. Reference in Copilot Chats

```
"Please review the git workflow rules in .vscode/copilot-rules.md before suggesting any git operations."
```

### GitHub Actions Integration

#### 1. Workflow Validation Action

`.github/workflows/validate-git-rules.yml`:

```yaml
name: Validate Git Rules

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install MCP Git Rules
        run: npm install -g @fraqtiv/git-rules-mcp
        
      - name: Validate Repository Compliance
        run: |
          echo "🔍 Checking repository compliance..."
          mcp-git-rules analyze-compliance
          
      - name: Check Branch Protection
        if: github.ref == 'refs/heads/main'
        run: |
          echo "❌ Direct push to main detected"
          exit 1
```

#### 2. PR Validation

`.github/workflows/pr-validation.yml`:

```yaml
name: PR Git Rules Validation

on:
  pull_request:
    branches: [main]

jobs:
  validate-workflow:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate PR follows git workflow
        run: |
          # Check if PR is from dev branch
          if [ "${{ github.head_ref }}" != "dev" ]; then
            echo "❌ PRs to main must come from dev branch"
            exit 1
          fi
          
          # Validate commit messages
          mcp-git-rules validate-commits ${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }}
```

## VS Code Extension Development

### Custom Extension for Copilot Integration

Create a VS Code extension that bridges MCP and Copilot:

```typescript
// extension.ts
import * as vscode from 'vscode';
import { MCPClient } from './mcp-client';

export function activate(context: vscode.ExtensionContext) {
    const mcpClient = new MCPClient('mcp-git-rules');
    
    // Register git command interceptor
    const gitProvider = vscode.workspace.registerTextDocumentContentProvider(
        'git-rules',
        new GitRulesProvider(mcpClient)
    );
    
    // Add Copilot context provider
    vscode.copilot.registerContextProvider(
        'git-rules',
        new GitRulesContextProvider(mcpClient)
    );
    
    context.subscriptions.push(gitProvider);
}

class GitRulesContextProvider implements vscode.CopilotContextProvider {
    async provideContext(): Promise<vscode.CopilotContext[]> {
        const status = await this.mcpClient.getRepositoryStatus();
        const rules = await this.mcpClient.getActiveRules();
        
        return [
            {
                name: 'git-workflow-rules',
                content: `Current branch: ${status.branch}\nRules: ${JSON.stringify(rules, null, 2)}`
            }
        ];
    }
}
```

## Configuration Examples

### Project Configuration

`.vscode/git-rules.json`:

```json
{
  "gitRules": {
    "mcpServer": "mcp-git-rules",
    "autoValidation": true,
    "copilotIntegration": true,
    "preCommitValidation": true,
    "branchProtection": {
      "main": {
        "allowDirectPush": false,
        "allowDirectCommit": false,
        "requirePullRequest": true
      }
    }
  }
}
```

### Global VS Code Settings

```json
{
  "github.copilot.chat.localeOverride": "en",
  "mcp-git-rules.autoStart": true,
  "mcp-git-rules.validation": {
    "commits": true,
    "pushes": true,
    "merges": true
  },
  "git.inputValidation": "always"
}
```

## Troubleshooting

### Copilot Not Aware of Rules

1. Add git rules to workspace documentation
2. Reference rules explicitly in chat conversations
3. Use consistent vocabulary in interactions
4. Create custom Copilot instructions file

### Validation Not Working

1. Check if MCP server is running: `mcp-git-rules --test`
2. Verify VS Code extension configuration
3. Test git wrapper script independently
4. Check pre-commit hooks are executable

### Performance Issues

- Use cached MCP responses for repeated queries
- Configure shorter MCP timeouts
- Enable validation only for protected operations

## Best Practices

### 1. Explicit Instructions
Always be explicit about git workflow rules in your Copilot conversations.

### 2. Consistent Patterns  
Use consistent language patterns when discussing git operations with Copilot.

### 3. Workspace Documentation
Maintain clear git workflow documentation that Copilot can reference.

### 4. Regular Validation
Set up automated validation through hooks and CI/CD pipelines.

## Limitations

- No direct MCP protocol support in Copilot
- Requires workarounds and bridge solutions  
- Manual configuration needed for full integration
- Limited real-time validation compared to native MCP clients

## Need Help?

- [Main Documentation](../README.md)
- [VS Code MCP Extensions](https://marketplace.visualstudio.com/search?term=mcp)
- [GitHub Issues](https://github.com/FRAQTIV/gitrules-mcp-server/issues)