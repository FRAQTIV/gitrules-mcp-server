import fs from 'node:fs';
import path from 'node:path';
import { GitHooksInstallInputSchema, GitHooksInstallOutputSchema } from '../types/schemas.js';

const PRE_PUSH_SCRIPT = `#!/bin/sh
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "develop" ] || [ "$BRANCH" = "dev" ]; then
  echo "Direct pushes to $BRANCH are not allowed. Open a PR (feature/* -> develop) then merge to main." >&2
  exit 1
fi
exit 0
`;

export async function gitHooksInstallTool(input: { force?: boolean }) {
  const repoPath = process.env.GIT_RULES_REPO_PATH || process.cwd();
  const hooksDir = path.join(repoPath, '.githooks');
  const hookPath = path.join(hooksDir, 'pre-push');
  if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });
  let overwritten = false;
  if (fs.existsSync(hookPath)) {
    const current = fs.readFileSync(hookPath, 'utf8');
    if (current !== PRE_PUSH_SCRIPT) {
      if (!input.force) {
        return { api_version: '1.1.0', data: { path: hookPath, overwritten: false, message: 'Hook exists (different content) - use force to overwrite.' } };
      }
      overwritten = true;
    }
  }
  fs.writeFileSync(hookPath, PRE_PUSH_SCRIPT, { mode: 0o755 });
  // set core.hooksPath
  try {
    await import('node:child_process').then(({ execSync }) => {
      execSync('git config core.hooksPath .githooks', { cwd: repoPath });
    });
  } catch {
    /* ignore config error */
  }
  return { api_version: '1.1.0', data: { path: hookPath, overwritten, message: overwritten ? 'Hook overwritten' : 'Hook installed' } };
}

export const gitHooksInstallDef = {
  name: 'git.hooks.install',
  stability: 'experimental' as const,
  description: 'Install or update pre-push hook enforcing protected branches',
  inputSchema: GitHooksInstallInputSchema,
  outputSchema: GitHooksInstallOutputSchema,
  handler: gitHooksInstallTool
};
