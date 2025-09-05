#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

// MCP Server Implementation for Git Rules Compliance

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface GitRulesConfig {
  protectedBranches: string[];
  integrationBranch: string;
  featureBranchPrefix: string;
  hotfixBranchPrefix: string;
  requireCleanWorkingTree: boolean;
  allowDirectPush: boolean;
  enforceCommitMessageFormat: boolean;
  allowedCommitTypes: string[];
}

class GitRulesMCPServer {
  config: GitRulesConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): GitRulesConfig {
    const configPath = '.gitrules.yaml';
    const defaultConfig: GitRulesConfig = {
      protectedBranches: ['main', 'master'],
      integrationBranch: 'dev',
      featureBranchPrefix: 'feature/',
      hotfixBranchPrefix: 'hotfix/',
      requireCleanWorkingTree: true,
      allowDirectPush: false,
      enforceCommitMessageFormat: true,
      allowedCommitTypes: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']
    };

    if (existsSync(configPath)) {
      try {
        const configFile = readFileSync(configPath, 'utf8');
        const parsed = parseYaml(configFile);
        return { ...defaultConfig, ...parsed };
      } catch (error) {
        console.error('Error reading config file, using defaults:', error);
      }
    }

    return defaultConfig;
  }

  private getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  private isWorkingTreeClean(): boolean {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.trim().length === 0;
    } catch {
      return false;
    }
  }

  private isProtectedBranch(branch: string): boolean {
    return this.config.protectedBranches.includes(branch);
  }

  private validateCommitMessage(message: string): { valid: boolean; message: string } {
    if (!this.config.enforceCommitMessageFormat) {
      return { valid: true, message: 'Commit message format validation disabled' };
    }

    const commitPattern = /^(feat|fix|docs|style|refactor|test|chore):\s.+/;
    if (!commitPattern.test(message)) {
      return {
        valid: false,
        message: `Commit message must follow format: "type: description". Allowed types: ${this.config.allowedCommitTypes.join(', ')}`
      };
    }

    const type = message.split(':')[0];
    if (!this.config.allowedCommitTypes.includes(type)) {
      return {
        valid: false,
        message: `Invalid commit type "${type}". Allowed types: ${this.config.allowedCommitTypes.join(', ')}`
      };
    }

    return { valid: true, message: 'Commit message format is valid' };
  }

  private getBranchType(branch: string): 'main' | 'integration' | 'feature' | 'hotfix' | 'other' {
    if (this.config.protectedBranches.includes(branch)) return 'main';
    if (branch === this.config.integrationBranch) return 'integration';
    if (branch.startsWith(this.config.featureBranchPrefix)) return 'feature';
    if (branch.startsWith(this.config.hotfixBranchPrefix)) return 'hotfix';
    return 'other';
  }

  private getSuggestedWorkflow(currentBranch: string, command: string): string {
    const branchType = this.getBranchType(currentBranch);
    
    if (command === 'commit' && branchType === 'main') {
      return `Instead of committing to ${currentBranch}, create a feature branch:\n` +
             `git checkout ${this.config.integrationBranch}\n` +
             `git checkout -b feature/your-feature-name`;
    }

    if (command === 'push' && branchType === 'feature') {
      return `After pushing your feature branch, merge to ${this.config.integrationBranch}:\n` +
             `git checkout ${this.config.integrationBranch}\n` +
             `git merge ${currentBranch}`;
    }

    if (command === 'merge' && branchType === 'main') {
      return `Only merge ${this.config.integrationBranch} to ${currentBranch} after testing:\n` +
             `Ensure ${this.config.integrationBranch} is tested and stable first`;
    }

    return '';
  }

  private validateGitCommand(command: string, args: string[] = []): { 
    allowed: boolean; 
    message: string; 
    severity: 'info' | 'warning' | 'error';
    suggestion?: string;
    workflow?: string;
  } {
    const currentBranch = this.getCurrentBranch();
    const isClean = this.isWorkingTreeClean();
    const branchType = this.getBranchType(currentBranch);
    const workflow = this.getSuggestedWorkflow(currentBranch, command);

    // RULE: Never allow direct commits to main branches
    if (command === 'commit' && branchType === 'main') {
      return {
        allowed: false,
        message: `Direct commits to protected branch '${currentBranch}' are forbidden`,
        severity: 'error',
        suggestion: `Create a feature branch first: git checkout ${this.config.integrationBranch} && git checkout -b feature/your-feature`,
        workflow
      };
    }

    // RULE: Never allow direct pushes to main branches
    if (command === 'push' && branchType === 'main' && !this.config.allowDirectPush) {
      return {
        allowed: false,
        message: `Direct push to protected branch '${currentBranch}' is not allowed`,
        severity: 'error',
        suggestion: `Use the integration branch '${this.config.integrationBranch}' first, then create a PR`,
        workflow
      };
    }

    // RULE: Require clean working tree for pushes to integration branch
    if (command === 'push' && branchType === 'integration' && this.config.requireCleanWorkingTree && !isClean) {
      return {
        allowed: false,
        message: `Working tree must be clean before pushing to integration branch '${currentBranch}'`,
        severity: 'error',
        suggestion: 'Commit or stash your changes first'
      };
    }

    // RULE: Warn about commits directly to integration branch
    if (command === 'commit' && branchType === 'integration') {
      return {
        allowed: true,
        message: `Committing directly to integration branch '${currentBranch}' - consider using a feature branch`,
        severity: 'warning',
        suggestion: `Create a feature branch: git checkout -b feature/your-feature`,
        workflow
      };
    }

    // RULE: Only allow merging from integration to main
    if (command === 'merge' && branchType === 'main') {
      const sourceBranch = args[0] || 'unknown';
      if (sourceBranch !== this.config.integrationBranch) {
        return {
          allowed: false,
          message: `Only '${this.config.integrationBranch}' can be merged into '${currentBranch}'`,
          severity: 'error',
          suggestion: `Merge to '${this.config.integrationBranch}' first, then merge to '${currentBranch}'`
        };
      }
      return {
        allowed: true,
        message: `Merging '${sourceBranch}' into '${currentBranch}' - ensure it's tested and stable`,
        severity: 'warning',
        workflow
      };
    }

    // RULE: Feature branches should merge to integration first
    if (command === 'merge' && branchType === 'integration') {
      const sourceBranch = args[0] || 'unknown';
      const sourceBranchType = this.getBranchType(sourceBranch);
      if (sourceBranchType === 'feature' || sourceBranchType === 'hotfix') {
        return {
          allowed: true,
          message: `Merging '${sourceBranch}' into integration branch '${currentBranch}'`,
          severity: 'info',
          workflow
        };
      }
    }

    // RULE: Validate commit message format if provided
    if (command === 'commit' && args.includes('-m')) {
      const messageIndex = args.indexOf('-m') + 1;
      if (messageIndex < args.length) {
        const commitValidation = this.validateCommitMessage(args[messageIndex]);
        if (!commitValidation.valid) {
          return {
            allowed: false,
            message: commitValidation.message,
            severity: 'error',
            suggestion: 'Use format: "type: description" where type is one of: ' + this.config.allowedCommitTypes.join(', ')
          };
        }
      }
    }

    // Default: Allow with appropriate context
    return {
      allowed: true,
      message: `Command '${command}' is allowed on ${branchType} branch '${currentBranch}'`,
      severity: 'info',
      workflow: workflow || undefined
    };
  }

  getRepositoryStatus() {
    const currentBranch = this.getCurrentBranch();
    const isClean = this.isWorkingTreeClean();
    const branchType = this.getBranchType(currentBranch);

    let statusFiles: string[] = [];
    if (!isClean) {
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        statusFiles = status.split('\n').filter(line => line.trim()).map(line => line.trim());
      } catch {
        statusFiles = ['Unable to get file status'];
      }
    }

    return {
      branch: currentBranch,
      branchType,
      isClean,
      isProtected: this.config.protectedBranches.includes(currentBranch),
      config: this.config,
      modifiedFiles: statusFiles
    };
  }

  private suggestWorkflow(task: string): { 
    workflow: string; 
    commands: string[]; 
    safety_checks: string[];
    description: string;
  } {
    const currentBranch = this.getCurrentBranch();
    const branchType = this.getBranchType(currentBranch);

    switch (task) {
      case 'start_feature':
        return {
          workflow: 'Create new feature branch',
          description: 'Start new feature development following proper branching workflow',
          commands: [
            `git checkout ${this.config.integrationBranch}`,
            `git pull origin ${this.config.integrationBranch}`,
            'git checkout -b feature/your-feature-name'
          ],
          safety_checks: [
            `Ensure you're on ${this.config.integrationBranch} branch`,
            'Pull latest changes first',
            'Use descriptive feature branch name'
          ]
        };

      case 'merge_feature':
        if (branchType !== 'feature') {
          return {
            workflow: 'Error: Not on feature branch',
            description: `Currently on ${branchType} branch '${currentBranch}'. Switch to a feature branch first.`,
            commands: [],
            safety_checks: ['You must be on a feature branch to merge it']
          };
        }
        return {
          workflow: 'Merge feature to integration',
          description: 'Merge completed feature to integration branch',
          commands: [
            `git push origin ${currentBranch}`,
            `git checkout ${this.config.integrationBranch}`,
            `git merge ${currentBranch}`,
            `git push origin ${this.config.integrationBranch}`,
            `git branch -d ${currentBranch}`,
            `git push origin --delete ${currentBranch}`
          ],
          safety_checks: [
            'Ensure feature is complete and tested',
            'Working tree should be clean',
            'Feature branch should be up to date'
          ]
        };

      case 'promote_to_main':
        if (currentBranch !== this.config.integrationBranch) {
          return {
            workflow: 'Error: Not on integration branch',
            description: `Currently on '${currentBranch}'. Only ${this.config.integrationBranch} can be promoted to main.`,
            commands: [],
            safety_checks: [`You must be on ${this.config.integrationBranch} branch`]
          };
        }
        return {
          workflow: 'Promote integration to main',
          description: 'Deploy tested integration branch to production',
          commands: [
            'git checkout main',
            `git merge ${this.config.integrationBranch}`,
            'git push origin main',
            'git tag -a v$(date +%Y%m%d) -m "Release $(date +%Y-%m-%d)"'
          ],
          safety_checks: [
            `${this.config.integrationBranch} must be fully tested`,
            'All QA checks should pass',
            'Deployment should be coordinated with team'
          ]
        };

      case 'hotfix':
        return {
          workflow: 'Create emergency hotfix',
          description: 'Create hotfix branch for urgent production fixes',
          commands: [
            'git checkout main',
            'git pull origin main',
            'git checkout -b hotfix/urgent-fix-name',
            '# Make your fix',
            'git add .',
            'git commit -m "fix: urgent fix description"',
            'git checkout main',
            'git merge hotfix/urgent-fix-name',
            `git checkout ${this.config.integrationBranch}`,
            'git merge hotfix/urgent-fix-name',
            'git push origin main',
            `git push origin ${this.config.integrationBranch}`,
            'git branch -d hotfix/urgent-fix-name'
          ],
          safety_checks: [
            'Only for urgent production issues',
            'Test the fix thoroughly',
            'Merge to both main and integration'
          ]
        };

      default:
        return {
          workflow: 'Unknown task',
          description: `Task '${task}' is not recognized`,
          commands: [],
          safety_checks: ['Available tasks: start_feature, merge_feature, promote_to_main, hotfix']
        };
    }
  }

  private analyzeRepositoryCompliance(): {
    isCompliant: boolean;
    issues: Array<{
      type: 'missing_branch' | 'extra_branch' | 'misnamed_branch' | 'config_mismatch';
      severity: 'error' | 'warning' | 'info';
      description: string;
      currentState: string;
      expectedState: string;
      recommendedAction: string;
      question: string;
    }>;
    summary: string;
  } {
    const issues: Array<{
      type: 'missing_branch' | 'extra_branch' | 'misnamed_branch' | 'config_mismatch';
      severity: 'error' | 'warning' | 'info';
      description: string;
      currentState: string;
      expectedState: string;
      recommendedAction: string;
      question: string;
    }> = [];

    try {
      // Get all branches
      const allBranches = execSync('git branch -a', { encoding: 'utf8' })
        .split('\n')
        .map(branch => branch.replace(/^\*?\s*/, '').replace(/^remotes\/origin\//, ''))
        .filter(branch => branch && branch !== 'HEAD' && !branch.includes('->'))
        .filter((branch, index, self) => self.indexOf(branch) === index); // dedupe

      // Check if expected integration branch exists
      const integrationBranchExists = allBranches.includes(this.config.integrationBranch);
      
      if (!integrationBranchExists) {
        // Check for similar branches that might be the intended integration branch
        const similarBranches = allBranches.filter(branch => 
          branch.includes('dev') || branch.includes('develop') || branch.includes('integration')
        );

        if (similarBranches.length > 0) {
          issues.push({
            type: 'misnamed_branch',
            severity: 'error',
            description: `Integration branch '${this.config.integrationBranch}' not found, but similar branches exist`,
            currentState: `Available branches: ${similarBranches.join(', ')}`,
            expectedState: `Integration branch: ${this.config.integrationBranch}`,
            recommendedAction: `Rename existing branch or update config`,
            question: `Should I rename '${similarBranches[0]}' to '${this.config.integrationBranch}' or update the config to use '${similarBranches[0]}'?`
          });
        } else {
          issues.push({
            type: 'missing_branch',
            severity: 'error', 
            description: `Integration branch '${this.config.integrationBranch}' does not exist`,
            currentState: `Available branches: ${allBranches.join(', ')}`,
            expectedState: `Integration branch: ${this.config.integrationBranch}`,
            recommendedAction: `Create integration branch from main`,
            question: `Should I create the missing integration branch '${this.config.integrationBranch}' from main?`
          });
        }
      }

      // Check for protected branches that exist
      const missingProtectedBranches = this.config.protectedBranches.filter(branch => 
        !allBranches.includes(branch)
      );

      missingProtectedBranches.forEach(branch => {
        issues.push({
          type: 'missing_branch',
          severity: 'warning',
          description: `Protected branch '${branch}' does not exist`,
          currentState: `Available branches: ${allBranches.join(', ')}`,
          expectedState: `Protected branch: ${branch}`,
          recommendedAction: `Create protected branch or remove from config`,
          question: `Should I create the protected branch '${branch}' or remove it from the configuration?`
        });
      });

      const isCompliant = issues.length === 0;
      const errorCount = issues.filter(i => i.severity === 'error').length;
      const warningCount = issues.filter(i => i.severity === 'warning').length;

      let summary = '';
      if (isCompliant) {
        summary = '✅ Repository is fully compliant with git workflow rules';
      } else {
        summary = `❌ Repository has compliance issues: ${errorCount} errors, ${warningCount} warnings`;
      }

      return {
        isCompliant,
        issues,
        summary
      };

    } catch (error) {
      return {
        isCompliant: false,
        issues: [{
          type: 'config_mismatch',
          severity: 'error',
          description: 'Unable to analyze repository compliance',
          currentState: `Error: ${error}`,
          expectedState: 'Accessible git repository',
          recommendedAction: 'Ensure you are in a valid git repository',
          question: 'Are you in the correct git repository directory?'
        }],
        summary: '❌ Unable to analyze repository compliance'
      };
    }
  }

  private handleRequest(request: JsonRpcRequest): JsonRpcResponse {
    try {
      switch (request.method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: 'git-rules-mcp',
                version: '1.0.0'
              }
            }
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: [
                {
                  name: 'validate_git_command',
                  description: 'Validate a git command against repository workflow rules',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      command: { type: 'string', description: 'Git command to validate (push, commit, merge)' },
                      args: { type: 'array', items: { type: 'string' }, description: 'Command arguments', default: [] }
                    },
                    required: ['command']
                  }
                },
                {
                  name: 'get_repository_status',
                  description: 'Get current repository status, branch type, and workflow configuration',
                  inputSchema: {
                    type: 'object',
                    properties: {},
                    required: []
                  }
                },
                {
                  name: 'suggest_workflow',
                  description: 'Get workflow suggestions for common git tasks',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      task: { 
                        type: 'string', 
                        enum: ['start_feature', 'merge_feature', 'promote_to_main', 'hotfix'],
                        description: 'Workflow task to get suggestions for'
                      }
                    },
                    required: ['task']
                  }
                },
                {
                  name: 'analyze_repository_compliance',
                  description: 'Analyze repository compliance with git workflow rules and identify misalignments',
                  inputSchema: {
                    type: 'object',
                    properties: {},
                    required: []
                  }
                }
              ]
            }
          };

        case 'tools/call':
          const { name, arguments: toolArgs } = request.params;
          
          switch (name) {
            case 'validate_git_command':
              const { command, args = [] } = toolArgs;
              const validation = this.validateGitCommand(command, args);
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify(validation, null, 2)
                    }
                  ]
                }
              };

            case 'get_repository_status':
              const status = this.getRepositoryStatus();
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify(status, null, 2)
                    }
                  ]
                }
              };

            case 'suggest_workflow':
              const { task } = toolArgs;
              const workflowSuggestion = this.suggestWorkflow(task);
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify(workflowSuggestion, null, 2)
                    }
                  ]
                }
              };

            case 'analyze_repository_compliance':
              const complianceAnalysis = this.analyzeRepositoryCompliance();
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify(complianceAnalysis, null, 2)
                    }
                  ]
                }
              };

            default:
              return {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                  code: -32601,
                  message: `Unknown tool: ${name}`
                }
              };
          }

        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Unknown method: ${request.method}`
            }
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  public start(): void {
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    process.stdin.on('data', (chunk: string) => {
      buffer += chunk;
      
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        
        if (line) {
          try {
            const request: JsonRpcRequest = JSON.parse(line);
            const response = this.handleRequest(request);
            process.stdout.write(JSON.stringify(response) + '\n');
          } catch (error) {
            const errorResponse: JsonRpcResponse = {
              jsonrpc: '2.0',
              id: 'unknown',
              error: {
                code: -32700,
                message: 'Parse error'
              }
            };
            process.stdout.write(JSON.stringify(errorResponse) + '\n');
          }
        }
      }
    });

    process.stdin.on('end', () => {
      process.exit(0);
    });
  }
}

// Handle command line arguments
function handleCLI() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test') || args.includes('-t')) {
    console.log('🔍 Testing git-rules-mcp installation...\n');
    
    try {
      const server = new GitRulesMCPServer();
      console.log('✅ MCP Server: Initialized successfully');
      
      // Test git repository detection
      const status = server.getRepositoryStatus();
      console.log(`✅ Git Repository: ${status.branch ? 'Detected' : 'Not found'}`);
      
      // Test configuration loading
      console.log(`✅ Configuration: Loaded (${server.config.protectedBranches.length} protected branches)`);
      
      console.log('\n🎉 Installation test passed! The MCP server is ready to use.');
      console.log('\n💡 Usage:');
      console.log('  • Add to MCP client configuration');
      console.log('  • Use with Claude Code, Cursor, or other MCP-enabled assistants');
      console.log('  • Run echo \'{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\' | mcp-git-rules');
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Installation test failed:');
      console.error(`   ${(error as Error).message}`);
      process.exit(1);
    }
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Git Rules MCP Server\n');
    console.log('Usage: mcp-git-rules [options]\n');
    console.log('Options:');
    console.log('  --test, -t     Test installation and configuration');
    console.log('  --help, -h     Show this help message');
    console.log('  (no args)      Start MCP server (for use with MCP clients)');
    process.exit(0);
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  handleCLI();
  
  const server = new GitRulesMCPServer();
  server.start();
}