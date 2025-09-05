# Warp Terminal Integration Guide

**Difficulty**: ⭐⭐ (Easy Setup)  
**Integration Type**: Built-in MCP support with direct server configuration

Warp Terminal has native MCP (Model Context Protocol) support, making it easy to add the git-rules-mcp server directly through the terminal settings.

---

## 🎯 Overview

This guide will help you integrate the git-rules-mcp server with Warp Terminal's AI assistant. Once configured, Warp's AI will be able to:

- ✅ **Validate git commands** before execution
- ✅ **Suggest proper workflows** for branch management  
- ✅ **Prevent accidental commits** to protected branches
- ✅ **Enforce commit message standards**

---

## 📋 Prerequisites

1. **Warp Terminal** installed with AI features enabled
2. **Git Rules MCP Server** installed globally via npm
3. **Git repository** to test the integration

---

## 🚀 Installation Steps

### Step 1: Install the MCP Server

If you haven't already, install the git-rules-mcp server:

```bash
# Recommended: One-liner setup (prevents permission errors)
mkdir -p ~/.npm-global && \
npm config set prefix ~/.npm-global && \
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc && \
source ~/.zshrc && \
npm install -g @fraqtiv/git-rules-mcp && \
mcp-git-rules --test
```

### Step 2: Configure in Warp Settings

1. **Open Warp Terminal Settings**
   - Press `Cmd + ,` (macOS) or `Ctrl + ,` (Linux/Windows)
   - Or click the **Settings** gear icon in Warp Terminal

2. **Navigate to MCP Servers**
   - Go to **Features** → **Model Context Protocol**
   - Click **Add MCP Server** or **Configure Servers**

3. **Add Git Rules MCP Server**

   **Standard Configuration:**
   ```json
   {
     "name": "git-rules-mcp",
     "description": "Git workflow rules and validation",
     "command": "mcp-git-rules",
     "args": [],
     "env": {}
   }
   ```

   **Alternative Configuration (if using custom npm prefix):**
   ```json
   {
     "name": "git-rules-mcp", 
     "description": "Git workflow rules and validation",
     "command": "/Users/username/.npm-global/bin/mcp-git-rules",
     "args": [],
     "env": {}
   }
   ```

   > **💡 Tip**: Replace `/Users/username/` with your actual home directory path

### Step 3: Test the Integration

1. **Save and Restart Warp Terminal** (if required by your Warp version)

2. **Verify MCP Server is Active**
   - Return to Settings → Features → Model Context Protocol
   - Look for `git-rules-mcp` in the active servers list
   - Server status should show as "Connected" or "Active"

3. **Test Git Workflow Commands**
   - Navigate to a git repository in Warp Terminal
   - Ask the AI assistant about git workflow questions
   - Try commands that would normally be restricted

---

## 🧪 Testing the Integration

### Quick Validation Tests

1. **Repository Status Check**
   ```bash
   # Ask Warp's AI: "What's the current git repository status?"
   # The MCP server should provide detailed branch and workflow info
   ```

2. **Command Validation Test**
   ```bash
   # Ask Warp's AI: "Can I push directly to main branch?"
   # Should receive workflow guidance based on your repository rules
   ```

3. **Workflow Suggestion Test**
   ```bash
   # Ask Warp's AI: "How should I start working on a new feature?"
   # Should get step-by-step workflow instructions
   ```

### Expected AI Responses

When the integration is working correctly, Warp's AI assistant will:

- **Validate git commands** and warn about protected branch violations
- **Suggest proper workflows** like creating feature branches
- **Enforce commit standards** and recommend conventional commit formats
- **Provide repository insights** about branch status and cleanliness

---

## 🔧 Configuration Options

### Environment Variables

You can pass environment variables to the MCP server through Warp's configuration:

```json
{
  "name": "git-rules-mcp",
  "description": "Git workflow rules and validation",
  "command": "mcp-git-rules",
  "args": [],
  "env": {
    "NODE_ENV": "production",
    "DEBUG": "false"
  }
}
```

### Custom Arguments

While the git-rules-mcp server doesn't currently support custom arguments, you can prepare for future features:

```json
{
  "name": "git-rules-mcp",
  "description": "Git workflow rules and validation", 
  "command": "mcp-git-rules",
  "args": ["--verbose", "--strict-mode"],
  "env": {}
}
```

---

## 🐛 Troubleshooting

### Common Issues

**❌ MCP Server Not Found**
```bash
# Check if mcp-git-rules is in your PATH
which mcp-git-rules

# If not found, get the full path and update Warp config:
npm config get prefix
# Use: [prefix]/bin/mcp-git-rules in Warp configuration
```

**❌ Server Connection Issues**

1. **Ensure the binary is executable:**
   ```bash
   chmod +x ~/.npm-global/bin/mcp-git-rules
   ```

2. **Test the server manually:**
   ```bash
   mcp-git-rules --test
   # Should show successful initialization
   ```

3. **Check Warp MCP Logs:**
   - Go to Settings → Features → Model Context Protocol → Logs
   - Look for connection errors or startup issues

**❌ Commands Not Being Validated**

1. **Verify you're in a git repository:**
   ```bash
   git status
   # Should show git repository info
   ```

2. **Check if .gitrules.yaml exists:**
   ```bash
   ls -la .gitrules.yaml
   # Create one if it doesn't exist (see Configuration section)
   ```

3. **Test MCP tools directly:**
   - Ask Warp AI: "List available MCP tools"
   - Should see git-rules-related tools

### Advanced Debugging

**Check MCP Server Status:**
```bash
# Test the server responds to MCP protocol:
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | mcp-git-rules
```

**Restart MCP Integration:**
1. Go to Warp Settings → Features → Model Context Protocol
2. Disable and re-enable the git-rules-mcp server
3. Restart Warp Terminal completely

---

## ⚙️ Repository Configuration

Create a `.gitrules.yaml` file in your repository root for custom rules:

```yaml
# Protected branches (cannot be directly modified)
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

# Conventional commit types allowed
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

## 🎪 Advanced Usage

### Workflow Automation

Once integrated, you can ask Warp's AI assistant:

- **"How do I start a new feature?"** - Get step-by-step feature branch workflow
- **"Can I commit this change?"** - Validate commit against repository rules
- **"What's wrong with my git state?"** - Get repository compliance analysis
- **"How do I merge my feature?"** - Get proper merge workflow instructions

### Team Collaboration

The git-rules-mcp server helps maintain consistent workflows across your team:

1. **Standardized Branch Protection** - Prevents direct pushes to main/master
2. **Conventional Commits** - Enforces proper commit message formats
3. **Clean Working Trees** - Requires clean state for important operations
4. **Guided Workflows** - Provides consistent feature development processes

---

## 📚 Additional Resources

- **[Configuration Guide](configuration.md)** - Detailed .gitrules.yaml options
- **[Main README](../README.md)** - Installation and general information
- **[Troubleshooting](../README.md#-troubleshooting)** - Common installation issues

---

## 🤝 Getting Help

If you encounter issues specific to Warp Terminal integration:

1. **Test the MCP server independently:** `mcp-git-rules --test`
2. **Check Warp's MCP documentation** in their settings
3. **Review MCP server logs** in Warp settings
4. **Create an issue** at [GitHub Issues](https://github.com/FRAQTIV/gitrules-mcp-server/issues)

---

**⭐ Star the project** if this integration helps improve your git workflow in Warp Terminal!