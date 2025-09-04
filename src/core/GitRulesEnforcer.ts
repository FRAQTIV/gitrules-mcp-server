export interface GitRulesConfig {
  protectedBranches: string[];
  featurePrefix: string;
  repoPath: string;
}

import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { execSync } from 'node:child_process';

let cachedConfig: GitRulesConfig | null = null;
let cachedMtime: number | null = null;

function loadConfig(): GitRulesConfig {
  const protectedEnv = process.env.GIT_RULES_PROTECTED || 'main,dev,develop';
  const featurePrefix = process.env.GIT_RULES_FEATURE_PREFIX || 'feature/';
  const repoPath = process.env.GIT_RULES_REPO_PATH || process.cwd();
  const filePath = path.join(repoPath, '.gitrules.yaml');
  try {
    const stat = fs.statSync(filePath);
    const mtime = stat.mtimeMs;
    if (cachedConfig && cachedMtime === mtime) return cachedConfig;
    const raw = fs.readFileSync(filePath, 'utf8');
    const doc = parseYaml(raw) || {};
    const cfg: GitRulesConfig = {
      protectedBranches: Array.isArray(doc.protectedBranches) ? doc.protectedBranches : protectedEnv.split(',').map((s: string)=>s.trim()).filter(Boolean),
      featurePrefix: doc.featurePrefix || featurePrefix,
      repoPath
    };
    cachedConfig = cfg;
    cachedMtime = mtime;
    return cfg;
  } catch {
    return {
    protectedBranches: protectedEnv.split(',').map(s => s.trim()).filter(Boolean),
    featurePrefix,
    repoPath
    };
  }
}

export class GitRulesEnforcer {
  config: GitRulesConfig = loadConfig();

  refresh() { this.config = loadConfig(); }
  update(partial: Partial<Pick<GitRulesConfig,'protectedBranches'|'featurePrefix'>>) {
    const filePath = path.join(this.config.repoPath, '.gitrules.yaml');
    let current: any = {};
    try { current = parseYaml(fs.readFileSync(filePath,'utf8')) || {}; } catch { /* ignore */ }
    if (partial.protectedBranches) current.protectedBranches = partial.protectedBranches;
    if (partial.featurePrefix) current.featurePrefix = partial.featurePrefix;
  fs.writeFileSync(filePath, '# Updated by server.config tool\n' + stringifyYaml(current));
    cachedConfig = null; // force reload next access
    this.refresh();
    return this.config;
  }

  validate(command: string, _args: string[] = []) {
    const status = this.getStatus();
    if (command === 'push' && status.isProtected && !status.isClean) {
      return { allowed: false, severity: 'error' as const, reason: 'Cannot push to protected branch with uncommitted changes', suggestion: 'Commit or stash changes before pushing.' };
    }
    if (command === 'push' && status.isProtected) {
      return { allowed: true, severity: 'warn' as const, reason: 'Pushing to protected branch', suggestion: 'Consider using a feature branch.' };
    }
    if (command === 'commit' && status.isProtected) {
      return { allowed: true, severity: 'info' as const, reason: 'Commit on protected branch', suggestion: 'Prefer feature branches for new work.' };
    }
    return { allowed: true };
  }

  getStatus() {
    // Lightweight git introspection (best effort). Not throwing on failure.
    let branch = 'unknown';
    let isClean = true;
    try {
  branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: this.config.repoPath }).toString().trim();
  const status = execSync('git status --porcelain', { cwd: this.config.repoPath }).toString();
      isClean = status.trim().length === 0;
    } catch {
      // ignore
    }
    const isProtected = this.config.protectedBranches.includes(branch);
    return {
      branch,
      isClean,
      isProtected,
      allowedActions: ['commit','push'],
      warnings: isProtected ? ['Protected branch'] : []
    };
  }
}
