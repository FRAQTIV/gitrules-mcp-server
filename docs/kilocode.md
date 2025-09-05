# KILOCODE Integration Guide

## Overview

KILOCODE (part of the Kilo ecosystem) provides AI-powered development assistance with extensibility features. This guide covers integrating git rules through KILOCODE's plugin system and workflow automation.

## Quick Setup

### 1. Install the MCP Server

```bash
npm install -g @fraqtiv/git-rules-mcp
```

### 2. KILOCODE Plugin Integration

#### Option A: Direct Plugin Installation

```bash
# Install KILOCODE git rules plugin  
kilo plugin install @fraqtiv/kilocode-git-rules

# Or install from source
kilo plugin install git+https://github.com/FRAQTIV/kilocode-git-rules.git
```

#### Option B: MCP Bridge Configuration

Create `kilo.config.json` in your project root:

```json
{
  "plugins": {
    "git-rules": {
      "type": "mcp-bridge",
      "command": "mcp-git-rules",
      "autoStart": true,
      "validation": {
        "commits": true,
        "pushes": true,
        "branches": true
      }
    }
  },
  "workflows": {
    "git": {
      "validateBeforeOperation": true,
      "suggestAlternatives": true,
      "enforceRules": true
    }
  }
}
```

### 3. Environment Configuration

Set up environment variables for enhanced integration:

```bash
export KILO_GIT_RULES_ENABLED=true
export KILO_GIT_RULES_STRICT_MODE=true
export KILO_MCP_SERVER="mcp-git-rules"
```

## KILOCODE Workflow Integration

### AI Assistant Configuration

Configure KILOCODE's AI assistant to respect git rules:

```javascript
// .kilo/assistant-config.js
module.exports = {
  systemPrompts: [
    "Always validate git operations using the git-rules MCP server",
    "Before any git command, check repository status and validate the operation",
    "If a git operation is blocked, explain why and suggest alternatives",
    "Follow conventional commit message format"
  ],
  
  tools: {
    "git-validate": {
      type: "mcp",
      server: "git-rules", 
      tool: "validate_git_command"
    },
    "git-status": {
      type: "mcp",
      server: "git-rules",
      tool: "get_repository_status" 
    },
    "git-suggest": {
      type: "mcp",
      server: "git-rules",
      tool: "suggest_workflow"
    }
  },
  
  workflows: {
    "safe-commit": [
      { tool: "git-status" },
      { tool: "git-validate", args: ["commit"] },
      { condition: "validated", action: "commit" }
    ],
    "safe-push": [
      { tool: "git-status" },
      { tool: "git-validate", args: ["push"] },
      { condition: "validated", action: "push" }
    ]
  }
};
```

### Code Generation Rules

Configure KILOCODE to generate git-aware code:

```yaml
# .kilo/code-generation.yml
git:
  rules:
    - name: "Branch Protection"
      description: "Never generate code that directly commits to main"
      pattern: "git.*commit.*main"
      action: "block"
      suggestion: "Create feature branch first"
      
    - name: "Commit Message Format"
      description: "Generate conventional commit messages"
      pattern: "git commit -m"
      transform: "conventional-commits"
      types: ["feat", "fix", "docs", "style", "refactor", "test", "chore"]

  workflows:
    feature-development:
      steps:
        - validate_branch
        - create_feature_branch
        - implement_changes
        - test_changes
        - commit_with_rules
        - merge_to_dev
```

## Plugin Development

### Custom KILOCODE Git Rules Plugin

Create a custom plugin for deeper integration:

```typescript
// src/kilocode-git-rules-plugin.ts
import { KiloPlugin, PluginContext } from '@kilocode/plugin-api';
import { MCPClient } from './mcp-client';

export class GitRulesPlugin implements KiloPlugin {
  private mcpClient: MCPClient;
  
  constructor() {
    this.mcpClient = new MCPClient('mcp-git-rules');
  }
  
  async initialize(context: PluginContext): Promise<void> {
    // Register git command interceptors
    context.registerCommandInterceptor('git', this.interceptGitCommand.bind(this));
    
    // Register AI tools
    context.registerTool('validate-git', this.validateGitCommand.bind(this));
    context.registerTool('suggest-workflow', this.suggestWorkflow.bind(this));
    
    // Register status providers
    context.registerStatusProvider('git-rules', this.getGitRulesStatus.bind(this));
  }
  
  async interceptGitCommand(command: string, args: string[]): Promise<boolean> {
    const validation = await this.mcpClient.validateCommand(command, args);
    
    if (!validation.allowed) {
      context.showError(validation.message);
      if (validation.suggestion) {
        context.showSuggestion(validation.suggestion);
      }
      return false; // Block command
    }
    
    return true; // Allow command
  }
  
  async validateGitCommand(command: string, args?: string[]): Promise<any> {
    return await this.mcpClient.validateCommand(command, args);
  }
  
  async suggestWorkflow(task: string): Promise<any> {
    return await this.mcpClient.suggestWorkflow(task);
  }
  
  async getGitRulesStatus(): Promise<any> {
    return await this.mcpClient.getRepositoryStatus();
  }
}

export default GitRulesPlugin;
```

### Plugin Package Configuration

```json
{
  "name": "@fraqtiv/kilocode-git-rules",
  "version": "1.0.0",
  "description": "Git rules integration for KILOCODE",
  "main": "dist/index.js",
  "kilocode": {
    "plugin": {
      "name": "git-rules",
      "version": "1.0.0",
      "author": "FRAQTIV",
      "description": "Enforce git workflow rules in KILOCODE",
      "capabilities": [
        "command-interception",
        "ai-tools",
        "status-providers",
        "workflow-automation"
      ]
    }
  },
  "dependencies": {
    "@kilocode/plugin-api": "^1.0.0",
    "@fraqtiv/git-rules-mcp": "^1.0.0"
  }
}
```

## Workflow Automation

### Automated Feature Development

Create automated workflows in `.kilo/workflows/`:

```yaml
# .kilo/workflows/feature-workflow.yml
name: "Safe Feature Development"
description: "Complete feature development with git rule validation"

triggers:
  - command: "kilo feature start"
  - ai-request: "start new feature"

steps:
  - name: "Validate Repository State"
    tool: "git-status"
    validation:
      - working_tree_clean: true
      - on_integration_branch: true
    
  - name: "Get Feature Workflow"
    tool: "git-suggest"
    args:
      task: "start_feature"
    
  - name: "Create Feature Branch"
    action: "git-command"
    command: "checkout"
    args: ["-b", "feature/{{feature_name}}"]
    validate: true
    
  - name: "Generate Initial Code"
    tool: "code-generator"
    template: "{{feature_type}}"
    
  - name: "Create Initial Commit"
    action: "git-command"
    command: "commit"
    args: ["-m", "feat: {{commit_message}}"]
    validate: true
    
success:
  message: "Feature branch created and ready for development"
  next_steps:
    - "Implement your feature code"
    - "Use 'kilo feature finish' when ready to merge"

error:
  message: "Feature creation failed"
  suggestion: "Check repository status and git rules configuration"
```

### Merge Workflow

```yaml
# .kilo/workflows/merge-workflow.yml
name: "Safe Feature Merge"
description: "Merge feature with full validation"

triggers:
  - command: "kilo feature finish"
  - ai-request: "merge feature"

steps:
  - name: "Validate Feature Complete"
    tool: "git-status"
    validation:
      - working_tree_clean: true
      - on_feature_branch: true
      
  - name: "Get Merge Workflow"
    tool: "git-suggest"
    args:
      task: "merge_feature"
      
  - name: "Switch to Integration Branch"
    action: "git-command"
    command: "checkout"
    args: ["dev"]
    validate: true
    
  - name: "Update Integration Branch"
    action: "git-command"
    command: "pull"
    args: ["origin", "dev"]
    validate: true
    
  - name: "Merge Feature"
    action: "git-command" 
    command: "merge"
    args: ["{{current_feature_branch}}"]
    validate: true
    
  - name: "Push Integration Branch"
    action: "git-command"
    command: "push"
    args: ["origin", "dev"]
    validate: true
    
  - name: "Clean Up Feature Branch"
    action: "git-command"
    command: "branch"
    args: ["-d", "{{current_feature_branch}}"]
    
success:
  message: "Feature successfully merged to integration branch"
  next_steps:
    - "Feature ready for testing in dev environment"
    - "Create PR to main when ready for production"
```

## AI Assistant Training

### Context Provision

Train KILOCODE's AI with git workflow context:

```javascript
// .kilo/ai-context.js
module.exports = {
  git: {
    rules: [
      "Protected branches: main (no direct pushes)",
      "Integration branch: dev (merge features here first)",
      "Feature branches: use feature/ prefix",
      "Commit format: conventional commits (feat:, fix:, docs:, etc.)",
      "Always validate git commands before execution"
    ],
    
    workflows: {
      "new-feature": "dev → feature/name → dev → PR → main",
      "hotfix": "main → hotfix/name → main + dev",
      "release": "dev → main (via PR only)"
    },
    
    commands: {
      validate: "Always use git-validate before git operations",
      status: "Use git-status to check repository state",
      suggest: "Use git-suggest for workflow guidance"
    }
  }
};
```

### Conversation Examples

Train the AI with example conversations:

```markdown
# .kilo/training/git-conversations.md

## Starting New Feature

User: "I want to implement user authentication"

AI: "I'll help you start a new feature following our git workflow rules. Let me first check the repository status and guide you through the proper branch creation process."

[AI uses git-status tool]
[AI uses git-suggest with task: "start_feature"]
[AI guides through feature branch creation]

## Before Committing

User: "I've made changes to the login form, ready to commit"

AI: "Let me validate that commit is allowed on your current branch and check the repository state."

[AI uses git-status tool]
[AI uses git-validate with command: "commit"]
[AI either proceeds or suggests alternative workflow]
```

## Integration Examples

### Real-time Validation

```typescript
// KILOCODE extension for real-time git validation
import { KiloExtension } from '@kilocode/api';

export class GitRulesExtension extends KiloExtension {
  async onGitCommand(command: string, args: string[]) {
    // Real-time validation before git commands
    const validation = await this.callMCP('validate_git_command', {
      command,
      args
    });
    
    if (!validation.allowed) {
      this.showNotification({
        type: 'error',
        message: validation.message,
        actions: [{
          label: 'Show Suggestion',
          action: () => this.showSuggestion(validation.suggestion)
        }]
      });
      return false; // Block command
    }
    
    return true; // Allow command
  }
  
  async onFileChange(files: string[]) {
    // Check if changes affect git workflow
    if (files.includes('.gitrules.yaml')) {
      await this.reloadGitRules();
    }
  }
}
```

### Dashboard Integration

```vue
<!-- .kilo/components/GitRulesDashboard.vue -->
<template>
  <div class="git-rules-dashboard">
    <h3>Git Workflow Status</h3>
    
    <div class="status-card">
      <h4>Repository State</h4>
      <p>Branch: {{ status.branch }}</p>
      <p>Clean: {{ status.isClean ? '✅' : '❌' }}</p>
      <p>Protected: {{ status.isProtected ? '🔒' : '🔓' }}</p>
    </div>
    
    <div class="compliance-card">
      <h4>Rule Compliance</h4>
      <p>Status: {{ compliance.isCompliant ? '✅' : '❌' }}</p>
      <ul v-if="compliance.issues">
        <li v-for="issue in compliance.issues" :key="issue">
          {{ issue }}
        </li>
      </ul>
    </div>
    
    <div class="actions">
      <button @click="validateRepository">Validate Repository</button>
      <button @click="suggestWorkflow">Get Workflow Suggestions</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      status: {},
      compliance: {}
    };
  },
  
  async mounted() {
    await this.loadStatus();
  },
  
  methods: {
    async loadStatus() {
      this.status = await this.$kilo.callMCP('get_repository_status');
      this.compliance = await this.$kilo.callMCP('analyze_repository_compliance');
    },
    
    async validateRepository() {
      await this.loadStatus();
      this.$kilo.showNotification({
        message: 'Repository validation complete',
        type: 'success'
      });
    },
    
    async suggestWorkflow() {
      const suggestions = await this.$kilo.callMCP('suggest_workflow', {
        task: 'current_situation'
      });
      
      this.$kilo.showModal({
        title: 'Workflow Suggestions',
        content: suggestions
      });
    }
  }
};
</script>
```

## Configuration Reference

### Complete Configuration Example

```json
{
  "kilo": {
    "version": "1.0.0",
    "plugins": {
      "git-rules": {
        "enabled": true,
        "autoStart": true,
        "mcpServer": "mcp-git-rules",
        "validation": {
          "commits": true,
          "pushes": true,
          "merges": true,
          "branches": true
        },
        "ui": {
          "showDashboard": true,
          "realTimeStatus": true,
          "notifications": true
        }
      }
    },
    
    "ai": {
      "systemPrompts": [
        "Follow git workflow rules strictly",
        "Always validate git operations",
        "Suggest proper workflows when commands are blocked"
      ],
      "tools": {
        "git-rules": ["validate", "status", "suggest", "analyze"]
      }
    },
    
    "workflows": {
      "git": {
        "enforceRules": true,
        "autoSuggest": true,
        "validateBeforeExecution": true
      }
    }
  }
}
```

## Troubleshooting

### Plugin Not Loading

```bash
# Check plugin installation
kilo plugin list | grep git-rules

# Reinstall if needed
kilo plugin uninstall git-rules
kilo plugin install @fraqtiv/kilocode-git-rules

# Check logs
kilo logs --plugin git-rules
```

### MCP Connection Issues

```bash
# Test MCP server
mcp-git-rules --test

# Check KILOCODE MCP bridge
kilo mcp status

# Restart MCP services
kilo mcp restart
```

### AI Not Following Rules

1. Check AI system prompts in configuration
2. Verify git rules context is loaded
3. Test MCP tools manually
4. Update AI training examples

## Best Practices

### 1. Plugin Configuration
Use project-specific plugin configuration for team consistency.

### 2. Workflow Automation
Leverage KILOCODE's workflow system for common git operations.

### 3. AI Training
Provide comprehensive examples and context for AI assistant.

### 4. Real-time Feedback
Enable real-time validation and status updates.

## Need Help?

- [Main Documentation](../README.md)
- [KILOCODE Documentation](https://kilocode.dev/docs)
- [Plugin Development Guide](https://kilocode.dev/plugins)
- [GitHub Issues](https://github.com/FRAQTIV/gitrules-mcp-server/issues)