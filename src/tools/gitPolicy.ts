import { GitRulesPolicyInputSchema, GitRulesPolicyOutputSchema } from '../types/schemas.js';

const policyData = {
  git_rules_and_pull_request_policy: {
    branch_model: {
      main: {
        status: 'Protected',
        access: 'No direct commits',
        merge_source: 'develop branch only',
        requirements: 'Tests must pass'
      },
      develop: {
        purpose: 'Integration branch',
        access: 'No direct commits',
        merge_source: 'All features merge here first via PR'
      },
      feature: {
        naming: 'feature/<name>',
        scope: 'One feature/task per branch',
        source: 'Create from develop'
      },
      hotfix: {
        naming: 'hotfix/<name>',
        purpose: 'Emergency fixes',
        merge_targets: ['main','develop'],
        method: 'Via PRs'
      }
    },
    mandatory_pull_requests: {
      rules: [
        'All work from feature/* MUST be merged via a Pull Request into develop',
        'Never merge feature/* directly into main',
        'main only receives merges from develop',
        'Do not push commits directly to main or develop'
      ]
    },
    pr_requirements: {
      ci_checks: 'Must pass before merging',
      reviewer_approval: { minimum: 1, high_risk_changes: 2 },
      title_format: "Conventional Commits (e.g., 'feat: add assumption validator UI')",
      scope: 'Keep PRs focused; one logical change per PR',
      documentation: 'Link related issues and include brief testing notes'
    },
    commit_message_format: {
      types: {
        feat: 'new feature', fix: 'bug fix', docs: 'documentation', style: 'formatting (no logic)', refactor: 'restructure without behavior change', test: 'add or update tests', chore: 'tooling/maintenance'
      }
    },
    local_workflow: {
      steps: [
        'git checkout develop && git pull',
        'git checkout -b feature/<name>',
        'Work and commit with Conventional Commits',
        'git push -u origin feature/<name>',
        'Open PR: feature/<name> -> develop (use GitHub UI or gh pr create)'
      ]
    },
    pre_push_protection: {
      optional: true,
      script: '#!/bin/sh\nBRANCH=$(git rev-parse --abbrev-ref HEAD)\nif [ "$BRANCH" = "main" ] || [ "$BRANCH" = "develop" ]; then\n  echo "Direct pushes to $BRANCH are not allowed. Open a PR instead." >&2\n  exit 1\nfi\nexit 0',
      installation: { path: '.githooks/pre-push', config: 'git config core.hooksPath .githooks' }
    },
    worktrees: {
      usage: [
        'Use separate worktrees for develop and current feature branches',
        'After merge, delete feature branch and remove its worktree'
      ]
    },
    enforcement: {
      protection: 'Branch protection on main and develop in GitHub',
      requirements: 'PRs required for merges',
      prevention: 'Direct pushes blocked server-side'
    }
  },
  git_workflow_rules_for_llm_assistants: {
    branch_structure: {
      main: {
        purpose: 'Stable, deployable code only',
        protection: 'Protected branch - no direct commits',
        updates: 'Only via PR/merge from dev after testing',
        llm_rule: 'Never suggest direct commits to main'
      },
      dev: {
        purpose: 'Integration branch for all feature work',
        usage: 'All feature branches merge here first',
        testing: 'QA and staging testing happens from dev',
        llm_rule: 'Merge features here before suggesting main merge'
      },
      feature: {
        naming: 'feature/<name>',
        examples: ['feature/authentication','feature/user-dashboard'],
        lifecycle: 'Create → Develop → Test → Merge to dev → Delete',
        llm_rule: 'One branch per logical feature or task'
      }
    },
    workflow_commands: {
      creating_new_features: '# Always start from dev\ngit checkout dev\ngit pull origin dev\ngit checkout -b feature/feature-name',
      working_on_features: '# Regular development cycle\ngit add .\ngit commit -m "feat: descriptive commit message"\ngit push origin feature/feature-name',
      merging_features: '# Merge to dev first\ngit checkout dev\ngit merge feature/feature-name\ngit push origin dev\n\n# Clean up\ngit branch -d feature/feature-name\ngit push origin --delete feature/feature-name',
      promoting_to_production: '# Only after dev is tested and stable\ngit checkout main\ngit merge dev\ngit push origin main'
    },
    llm_assistant_rules: {
      when_to_suggest_branch_changes: {
        new_feature: 'Create feature/<name> branch',
        bug_fix: 'Create hotfix/<name> branch (merges to both dev and main)',
        integration_testing: 'Use dev branch',
        production_release: 'Use main branch'
      },
      what_not_to_suggest: [
        'Direct commits to main branch','Pushing untested code to dev','Working directly on dev for features','Deleting branches with unmerged work'
      ],
      commit_message_format: {
        format: 'type: short description',
        notes: ['DO NOT ADD SIGNATURES OR UNRELATED NOTES'],
        types: { feat: 'new feature', fix: 'bug fix', docs: 'documentation', style: 'formatting', refactor: 'code restructuring', test: 'adding tests', chore: 'maintenance' }
      }
    },
    worktree_management: {
      standard_structure: {
        main_directory: 'fraqtiv-helix-mvp/',
        dev_directory: 'fraqtiv-helix-mvp-dev/',
        feature_directory: 'fraqtiv-helix-mvp-feature/',
        descriptions: { main: 'main branch (stable)', dev: 'dev branch (integration)', feature: 'current feature work' }
      },
      llm_worktree_commands: {
        create_dev_worktree: 'git worktree add ../fraqtiv-helix-mvp-dev dev',
        create_feature_worktree: 'git worktree add ../fraqtiv-helix-mvp-feature feature/current-work',
        list_worktrees: 'git worktree list',
        remove_worktree: 'git worktree remove ../fraqtiv-helix-mvp-feature'
      }
    },
    safety_checks: {
      pre_operation_verification: [
        'Current branch is appropriate for the task',
        'Working directory is clean (git status)',
        'Latest changes are pulled (git pull)',
        'Target branch exists and is up to date'
      ]
    },
    common_scenarios: {
      starting_new_feature_work: {
        steps: [
          'Ensure in dev worktree: cd ../fraqtiv-helix-mvp-dev',
          'Pull latest: git pull origin dev',
          'Create feature branch: git checkout -b feature/new-feature',
          'Create feature worktree: git worktree add ../fraqtiv-helix-mvp-feature feature/new-feature'
        ]
      },
      code_review_ready: {
        steps: [
          'Push feature branch: git push origin feature/branch-name',
          'Suggest creating PR to dev branch',
          'Do not merge automatically'
        ]
      },
      emergency_hotfix: {
        steps: [
          'Create from main: git checkout main && git checkout -b hotfix/urgent-fix',
          'Fix and test',
          'Merge to both main and dev',
          'Tag the release'
        ]
      }
    },
    integration_notes: {
      '.agent_os_.CLAUDE.md': [
        'These configuration files should exist in main branch',
        'Feature branches inherit them automatically',
        'Worktrees share the same .git directory, so configurations persist',
        'Always commit config changes to appropriate branch first'
      ]
    },
    questions_before_git_operations: [
      'What branch should this work be done on?',
      'Have you pulled the latest changes?',
      'Is this ready for integration testing?',
      'Should this go to main or dev first?',
      'Do you want me to create a new worktree?'
    ]
  }
};

export async function gitRulesPolicyTool() {
  return { api_version: '1.1.0', data: policyData };
}

export const gitRulesPolicyDef = {
  name: 'git.rules.policy',
  stability: 'stable' as const,
  description: 'Full Git branching, PR, and workflow policy document',
  inputSchema: GitRulesPolicyInputSchema,
  outputSchema: GitRulesPolicyOutputSchema,
  handler: async () => gitRulesPolicyTool()
};
