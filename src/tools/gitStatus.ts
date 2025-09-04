import { ApiVersion, GitRulesStatusInputSchema, GitRulesStatusOutputSchema } from '../types/schemas.js';
import type { GitRulesStatusOutput } from '../types/schemas.js';
import { enforcer } from './shared.js';

export async function gitStatusTool(): Promise<GitRulesStatusOutput> {
  const status = enforcer.getStatus();
  return { api_version: ApiVersion, data: status };
}

export const gitStatusDef = {
  name: 'git.rules.status',
  stability: 'stable',
  description: 'Current repo status under rules',
  inputSchema: GitRulesStatusInputSchema,
  outputSchema: GitRulesStatusOutputSchema,
  handler: gitStatusTool
};
