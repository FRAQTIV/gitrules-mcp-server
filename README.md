# Git Rules MCP Server

[![npm version](https://img.shields.io/npm/v/@fraqtiv/git-rules-mcp.svg)](https://www.npmjs.com/package/@fraqtiv/git-rules-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI Status](https://github.com/FRAQTIV/gitrules-mcp-server/workflows/CI/badge.svg)](https://github.com/FRAQTIV/gitrules-mcp-server/actions)

**Enforce Git workflow rules and prevent repository violations with AI coding assistants.**

A Model Context Protocol (MCP) server that validates Git commands against configurable repository rules, providing workflow guidance and preventing common Git mistakes when working with AI coding assistants.

---

## 🚀 What It Does

- **🛡️ Branch Protection**: Prevents direct commits/pushes to protected branches (main, master, etc.)
- **📋 Workflow Validation**: Validates Git commands against your repository's workflow rules
- **🔄 Smart Suggestions**: Provides alternative workflows when commands are blocked
- **📝 Commit Standards**: Enforces conventional commit message formats
- **🧹 Repository Health**: Analyzes repository compliance with workflow rules
- **🤖 AI Integration**: Works seamlessly with Claude Code, Cursor, GitHub Copilot, and other AI assistants

---

## 🎯 Why You Need This

### The Problem
AI coding assistants can accidentally:
- Push directly to protected branches
- Create commits with poor messages
- Bypass your team's Git workflows
- Make repository management chaotic

### The Solution
This MCP server acts as a **gatekeeper** that:
- ✅ **Validates every Git operation** before execution
- ✅ **Enforces your team's workflow rules** consistently  
- ✅ **Guides AI assistants** to follow proper Git practices
- ✅ **Prevents repository violations** before they happen

---

## 📦 Quick Install

```bash
# Install globally
npm install -g @fraqtiv/git-rules-mcp

# Test installation (if PATH configured correctly)
mcp-git-rules --test

# If command not found, add npm global bin to your PATH:
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc  # or ~/.zshrc
source ~/.bashrc  # then retry: mcp-git-rules --test
```

### Troubleshooting Installation

If you see `command not found: mcp-git-rules` after installation:

```bash
# Check if package is installed
npm list -g @fraqtiv/git-rules-mcp

# Fix PATH issue (most common solution)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Alternative: run with full path
$(npm config get prefix)/bin/mcp-git-rules --test

# Or if using custom npm prefix like ~/.npm-global:
export PATH=~/.npm-global/bin:$PATH
mcp-git-rules --test
```

## ⚡ Quick Setup by AI Assistant

Choose your AI coding assistant for specific setup instructions:

| Assistant | Integration Guide | Setup Complexity |
|-----------|-------------------|------------------|
| [**Claude Code**](docs/claude-code.md) | Native MCP support with workflow configuration | ⭐⭐⭐ |
| [**Cursor**](docs/cursor.md) | MCP + .cursorrules integration | ⭐⭐ |
| [**GitHub Copilot**](docs/github-copilot.md) | Bridge extensions + git hooks | ⭐⭐⭐⭐ |
| [**KILOCODE**](docs/kilocode.md) | Plugin system integration | ⭐⭐⭐ |

> **💡 Quick Start**: Most users should start with the [Claude Code guide](docs/claude-code.md) for the smoothest experience.

---

## 🛠️ Basic Configuration

Create `.gitrules.yaml` in your repository root:

```yaml
# Protected branches that cannot be directly modified
protectedBranches:
  - main
  - master

# Integration branch where features are merged first  
integrationBranch: dev

# Branch naming conventions
featureBranchPrefix: feature/
hotfixBranchPrefix: hotfix/

# Workflow enforcement
requireCleanWorkingTree: true
allowDirectPush: false
enforceCommitMessageFormat: true

# Conventional commit types
allowedCommitTypes:
  - feat      # New features
  - fix       # Bug fixes  
  - docs      # Documentation
  - style     # Formatting
  - refactor  # Code restructuring
  - test      # Adding tests
  - chore     # Maintenance
```

---

## 🎮 How It Works

### 1. Repository Status Check
```bash
# The MCP server analyzes your repository
Current Branch: feature/user-auth
Status: Clean ✅
Protected: No ✅
Integration Branch: dev
```

### 2. Command Validation
```bash
# Before: git push origin main
❌ BLOCKED: Direct push to protected branch 'main'
💡 Suggestion: Merge to 'dev' first, then create PR to main

# Proper workflow:
✅ git checkout dev
✅ git merge feature/user-auth  
✅ git push origin dev
✅ Create PR: dev → main
```

### 3. Workflow Guidance
```bash
# AI Assistant asks: "How do I start a new feature?"
# MCP Server responds:

🚀 Starting New Feature:
1. git checkout dev
2. git pull origin dev  
3. git checkout -b feature/your-feature-name

✅ Ready to begin development!
```

---

## 🔧 Available Tools

The MCP server provides these tools to AI assistants:

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `get_repository_status` | Check branch, cleanliness, protection status | Before any Git operation |
| `validate_git_command` | Validate if a Git command is allowed | Before `push`, `commit`, `merge` |
| `suggest_workflow` | Get step-by-step workflow guidance | Starting features, merging, releases |
| `analyze_repository_compliance` | Full repository health check | Regular compliance audits |

---

## 🌟 Key Features

### Branch Protection
- **Protected Branches**: Prevent direct commits to main/master
- **Integration Workflow**: Enforce proper merge patterns
- **Clean Working Tree**: Require clean state for protected operations

### Commit Standards  
- **Conventional Commits**: Enforce `type: description` format
- **Type Validation**: Only allow configured commit types
- **Message Quality**: Ensure meaningful commit messages

### Workflow Automation
- **Smart Suggestions**: Alternative paths when commands blocked
- **Step-by-Step Guidance**: Complete workflow instructions  
- **Safety Checks**: Validate before every operation

### AI Assistant Integration
- **Universal Compatibility**: Works with any MCP-enabled AI assistant
- **Real-time Validation**: Immediate feedback on Git operations
- **Educational**: Teaches proper Git workflows

---

## 📖 Example Workflows

### Protected Branch Workflow
```
main (protected) ← PR ← dev ← merge ← feature/new-auth
                                   ↑
                              You work here
```

### Feature Development Flow
```bash
# 1. Start new feature (validated by MCP)
git checkout dev
git pull origin dev
git checkout -b feature/user-authentication

# 2. Development work
git add .
git commit -m "feat: add user login form"
git commit -m "test: add login form tests"

# 3. Feature complete (validated by MCP)  
git checkout dev
git merge feature/user-authentication
git push origin dev

# 4. Production release
# Create PR: dev → main (only way to update main)
```

---

## 🏗️ Advanced Usage

### Custom Rules
```yaml
# .gitrules.yaml - Advanced configuration
protectedBranches:
  - main
  - staging
  - release/*

workflowRules:
  requirePullRequest: true
  requireCodeReview: true
  requireStatusChecks: true
  
branchNaming:
  feature: "feature/JIRA-123-description"
  hotfix: "hotfix/JIRA-456-critical-fix"
  
commitRules:
  maxLength: 72
  requireJiraTicket: true
  allowedScopes: ["auth", "api", "ui", "docs"]
```

### CI/CD Integration
```yaml
# .github/workflows/validate-git-rules.yml
name: Git Rules Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @fraqtiv/git-rules-mcp
      - run: mcp-git-rules analyze-compliance
```

---

## 🔍 Troubleshooting

### Common Issues

**Command Not Found After Installation**
```bash
# Error: zsh: command not found: mcp-git-rules

# Most common cause: npm global bin not in PATH
# Solution: Add npm global bin to your shell PATH
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.zshrc  # or ~/.bashrc
source ~/.zshrc

# Test the fix
mcp-git-rules --test
```

**Permission Denied During Installation**
```bash
# Error: EACCES: permission denied, mkdir '/usr/lib/node_modules/@fraqtiv'

# Solution 1: Configure npm to use user directory (recommended)
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc  # or ~/.zshrc
source ~/.bashrc  # or source ~/.zshrc
npm install -g @fraqtiv/git-rules-mcp

# Solution 2: Use sudo (not recommended for security)
sudo npm install -g @fraqtiv/git-rules-mcp
```

**Package Installation Issues**
```bash
# Check installation
npm list -g @fraqtiv/git-rules-mcp

# Reinstall if needed
npm install -g @fraqtiv/git-rules-mcp
```

**Rules Not Being Enforced**
- See [Claude Code Caveats](docs/claude-code.md#important-caveats)
- Ensure project has proper workflow documentation
- AI assistants need explicit instruction to use MCP tools

**Configuration Not Loading**
```bash
# Test configuration
mcp-git-rules --config-check

# Validate YAML syntax
mcp-git-rules --validate-config .gitrules.yaml
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/FRAQTIV/gitrules-mcp-server.git
cd gitrules-mcp-server
npm install
npm run build
npm test
```

---

## 📋 Roadmap

- [ ] **Web Dashboard** - Visual repository compliance dashboard
- [ ] **Team Analytics** - Workflow compliance metrics and reporting  
- [ ] **Custom Hooks** - Extensible validation system
- [ ] **Integration Templates** - Pre-built configurations for popular workflows
- [ ] **Enterprise Features** - Advanced compliance and audit logging

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙋 Support & Community

- **📖 Documentation**: [Full docs and integration guides](docs/)
- **🐛 Issues**: [GitHub Issues](https://github.com/FRAQTIV/gitrules-mcp-server/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/FRAQTIV/gitrules-mcp-server/discussions)
- **🔗 Website**: [https://fraqtiv.github.io/gitrules-mcp-server](https://fraqtiv.github.io/gitrules-mcp-server)

---

<div align="center">

**⭐ Star this repo if it helps keep your Git workflow clean! ⭐**

Made with ❤️ by [FRAQTIV](https://github.com/FRAQTIV)

</div>
