# Configuration Reference

## Overview

The Git Rules MCP Server uses `.gitrules.yaml` files for configuration. This document provides a complete reference of all available configuration options.

## Configuration File Location

The MCP server looks for configuration in this order:

1. `.gitrules.yaml` in the current repository root
2. `.gitrules.yml` in the current repository root  
3. Default configuration (basic protection rules)

## Complete Configuration Schema

```yaml
# ============================================================================
# BASIC BRANCH PROTECTION
# ============================================================================

# Branches that cannot be directly committed to or pushed to
protectedBranches:
  - main
  - master
  - production
  - release/*      # Supports glob patterns

# The integration branch where features are merged before going to main
integrationBranch: dev

# ============================================================================
# BRANCH NAMING CONVENTIONS  
# ============================================================================

# Required prefix for feature branches
featureBranchPrefix: feature/

# Required prefix for hotfix branches  
hotfixBranchPrefix: hotfix/

# Required prefix for release branches
releaseBranchPrefix: release/

# Custom branch patterns (advanced)
branchPatterns:
  feature: "^feature/[A-Z]+-\\d+-[a-z0-9-]+$"   # JIRA-123-description
  hotfix: "^hotfix/[A-Z]+-\\d+-[a-z0-9-]+$"    # JIRA-456-critical-fix
  release: "^release/v\\d+\\.\\d+\\.\\d+$"      # release/v1.2.3

# ============================================================================
# WORKFLOW ENFORCEMENT
# ============================================================================

# Require clean working tree before protected operations
requireCleanWorkingTree: true

# Allow direct pushes to protected branches (not recommended)
allowDirectPush: false

# Require pull requests for protected branch updates
requirePullRequest: true

# Allow force pushes (dangerous)
allowForcePush: false

# ============================================================================
# COMMIT MESSAGE VALIDATION
# ============================================================================

# Enforce conventional commit format: "type: description"
enforceCommitMessageFormat: true

# Maximum commit message length
maxCommitMessageLength: 72

# Allowed conventional commit types
allowedCommitTypes:
  - feat      # New feature
  - fix       # Bug fix
  - docs      # Documentation only changes
  - style     # Changes that do not affect meaning (white-space, formatting)
  - refactor  # Code change that neither fixes bug nor adds feature
  - perf      # Code change that improves performance
  - test      # Adding missing tests or correcting existing tests
  - chore     # Changes to build process or auxiliary tools
  - ci        # Changes to CI configuration files and scripts
  - build     # Changes that affect the build system
  - revert    # Reverts a previous commit

# Allowed scopes (optional)
allowedScopes:
  - api
  - ui  
  - auth
  - db
  - config
  - docs
  - tests

# Require ticket references in commits (e.g., JIRA-123)
requireTicketReference: true
ticketPattern: "[A-Z]+-\\d+"

# ============================================================================
# MERGE STRATEGIES
# ============================================================================

# Default merge strategy for feature branches
defaultMergeStrategy: "merge"  # Options: merge, squash, rebase

# Strategies per branch type
mergeStrategies:
  feature: "squash"     # Squash feature commits
  hotfix: "merge"       # Preserve hotfix history
  release: "merge"      # Preserve release history

# Require merge commit messages
requireMergeCommitMessage: true

# ============================================================================
# COLLABORATION RULES
# ============================================================================

# Require code review before merging
requireCodeReview: true

# Minimum number of approvals
minimumApprovals: 2

# Require status checks to pass
requireStatusChecks: true

# Required status checks
requiredStatusChecks:
  - "ci/tests"
  - "ci/lint" 
  - "security/scan"

# Allow merge with pending status checks
allowMergeWithPendingChecks: false

# ============================================================================
# REPOSITORY HEALTH
# ============================================================================

# Maximum age for stale branches (days)
staleBranchMaxAge: 30

# Branches to exclude from stale detection
staleBranchExclusions:
  - main
  - dev
  - "release/*"

# Warn about large files (MB)
maxFileSize: 100

# Warn about too many files in a commit
maxFilesPerCommit: 50

# ============================================================================
# NOTIFICATIONS & INTEGRATIONS
# ============================================================================

# Slack integration for rule violations
slack:
  enabled: false
  webhookUrl: "https://hooks.slack.com/services/..."
  channel: "#dev-ops"
  mentionUsers: ["@devops-team"]

# Email notifications
email:
  enabled: false
  smtpServer: "smtp.company.com"
  recipients: ["devops@company.com"]

# Jira integration
jira:
  enabled: false
  baseUrl: "https://company.atlassian.net"
  project: "DEV"
  createIssueOnViolation: false

# ============================================================================
# ADVANCED WORKFLOW RULES
# ============================================================================

# Custom workflow validation rules
customRules:
  # Prevent commits to main outside business hours
  - name: "business-hours-only"
    branches: ["main"]
    condition: "time between 09:00 and 17:00 Mon-Fri UTC"
    message: "Direct commits to main only allowed during business hours"
    
  # Require security review for auth changes
  - name: "security-review-auth"
    paths: ["src/auth/**", "config/security/**"]
    requireReview: true
    reviewers: ["@security-team"]
    message: "Security review required for authentication changes"

# Path-based rules
pathRules:
  # Protect configuration files
  "config/**":
    requireReview: true
    allowedUsers: ["@config-admins"]
    
  # Database migrations require special handling
  "db/migrations/**":
    requireLinearHistory: true
    preventDelete: true
    requireSequentialNaming: true

# User and team permissions
permissions:
  # Admin users who can bypass some rules
  admins: ["@admin-team", "john.doe@company.com"]
  
  # Users who can force push (emergency only)
  emergencyUsers: ["@devops-lead"]
  
  # Team-based branch permissions
  teams:
    "@frontend-team":
      branches: ["feature/ui-*", "feature/ux-*"] 
    "@backend-team": 
      branches: ["feature/api-*", "feature/db-*"]

# ============================================================================
# DEVELOPMENT & TESTING
# ============================================================================

# Enable debug logging
debug: false

# Dry run mode (validate but don't enforce)
dryRun: false

# Test mode configuration
testing:
  enabled: false
  mockGitCommands: true
  allowAllOperations: true

# Performance settings
performance:
  cacheEnabled: true
  cacheTimeout: 300  # seconds
  maxConcurrentValidations: 5

# ============================================================================
# LEGACY COMPATIBILITY
# ============================================================================

# Support for legacy branch names
legacyBranches:
  master: main      # Redirect master to main
  develop: dev      # Redirect develop to dev

# Migration settings
migration:
  # Gradually enforce rules (warning period)
  warningPeriodDays: 30
  
  # Exclude legacy commits from validation
  excludeCommitsBefore: "2024-01-01"
  
  # Allow legacy merge commit formats
  allowLegacyMergeCommits: true
```

## Environment Variables

Configuration can be overridden with environment variables:

```bash
# Basic settings
export GIT_RULES_CONFIG_FILE="/path/to/custom/.gitrules.yaml"
export GIT_RULES_DEBUG=true
export GIT_RULES_DRY_RUN=true

# Branch protection
export GIT_RULES_PROTECTED_BRANCHES="main,master,staging"
export GIT_RULES_INTEGRATION_BRANCH="dev"

# Commit validation
export GIT_RULES_ENFORCE_CONVENTIONAL_COMMITS=true
export GIT_RULES_MAX_COMMIT_LENGTH=100

# Workflow enforcement
export GIT_RULES_REQUIRE_CLEAN_TREE=true
export GIT_RULES_ALLOW_DIRECT_PUSH=false

# Performance
export GIT_RULES_CACHE_ENABLED=true
export GIT_RULES_CACHE_TIMEOUT=600
```

## Configuration Examples

### Minimal Configuration
```yaml
# .gitrules.yaml - Minimal setup
protectedBranches:
  - main
integrationBranch: dev
enforceCommitMessageFormat: true
```

### Team Configuration
```yaml
# .gitrules.yaml - Team development
protectedBranches:
  - main
  - staging

integrationBranch: dev
featureBranchPrefix: feature/

enforceCommitMessageFormat: true
allowedCommitTypes:
  - feat
  - fix
  - docs
  - chore

requirePullRequest: true
requireCodeReview: true
minimumApprovals: 1

staleBranchMaxAge: 14
```

### Enterprise Configuration  
```yaml
# .gitrules.yaml - Enterprise setup
protectedBranches:
  - main
  - staging
  - production
  - release/*

integrationBranch: dev
featureBranchPrefix: feature/
hotfixBranchPrefix: hotfix/
releaseBranchPrefix: release/

enforceCommitMessageFormat: true
requireTicketReference: true
ticketPattern: "[A-Z]+-\\d+"

requirePullRequest: true
requireCodeReview: true  
minimumApprovals: 2
requireStatusChecks: true

requiredStatusChecks:
  - "ci/tests"
  - "ci/security-scan"
  - "ci/lint"

customRules:
  - name: "security-review"
    paths: ["src/auth/**", "config/security/**"]
    requireReview: true
    reviewers: ["@security-team"]

slack:
  enabled: true
  webhookUrl: "${SLACK_WEBHOOK_URL}"
  channel: "#dev-ops"
```

## Validation

### Validate Configuration
```bash
# Test your configuration
mcp-git-rules --validate-config .gitrules.yaml

# Check current configuration
mcp-git-rules --show-config

# Test against repository
mcp-git-rules --config-test
```

### Common Validation Errors

**Invalid YAML Syntax**
```bash
Error: Invalid YAML in .gitrules.yaml at line 15
Fix: Check indentation and syntax
```

**Invalid Branch Pattern**
```bash
Error: Invalid regex in branchPatterns.feature: "^feature/[a-z"
Fix: Escape special characters or fix regex syntax
```

**Conflicting Rules**
```bash
Warning: allowDirectPush=true conflicts with requirePullRequest=true
Fix: Choose one approach for protected branch updates
```

## Schema Validation

The MCP server includes JSON Schema validation. You can enable schema validation in your editor:

### VS Code
```json
{
  "yaml.schemas": {
    "https://raw.githubusercontent.com/FRAQTIV/gitrules-mcp-server/main/schema/gitrules.schema.json": "**/.gitrules.yaml"
  }
}
```

### Vim/Neovim
```vim
" Add to your .vimrc
autocmd BufNewFile,BufRead .gitrules.yaml set filetype=yaml
let g:ale_yaml_yamllint_options = '--schema=gitrules'
```

## Migration Guide

### From GitFlow
```yaml
# GitFlow equivalent configuration
protectedBranches:
  - main
  - master
  
integrationBranch: develop  # GitFlow uses 'develop'
featureBranchPrefix: feature/
hotfixBranchPrefix: hotfix/
releaseBranchPrefix: release/

defaultMergeStrategy: "merge"
requireMergeCommitMessage: true
```

### From GitHub Flow
```yaml
# GitHub Flow equivalent  
protectedBranches:
  - main
  
# No integration branch in GitHub Flow
# integrationBranch: null

featureBranchPrefix: ""  # Any branch name allowed
requirePullRequest: true
requireCodeReview: true
```

## Performance Considerations

### Large Repositories
```yaml
# Optimize for large repos
performance:
  cacheEnabled: true
  cacheTimeout: 3600
  maxConcurrentValidations: 10

# Reduce validation scope
pathRules:
  # Skip validation for generated files
  "dist/**": 
    skipValidation: true
  "node_modules/**":
    skipValidation: true
```

### CI/CD Performance
```yaml
# Optimize for CI/CD
testing:
  enabled: true
  fastMode: true  # Skip expensive validations
  
performance:
  ciMode: true
  parallelValidation: true
```

## Need Help?

- [Main Documentation](../README.md)
- [Integration Guides](../docs/)
- [GitHub Issues](https://github.com/FRAQTIV/gitrules-mcp-server/issues)