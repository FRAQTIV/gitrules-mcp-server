import { ApiVersion, GitRulesValidateInputSchema, GitRulesValidateOutputSchema } from '../types/schemas.js';
import type { GitRulesValidateInput, GitRulesValidateOutput } from '../types/schemas.js';
import { enforcer } from './shared.js';

export async function gitValidateTool(input: GitRulesValidateInput): Promise<GitRulesValidateOutput> {
  const res = enforcer.validate(input.command, input.args||[]);
  return { api_version: ApiVersion, data: { ...res } };
}

export const gitValidateDef = {
  name: 'git.rules.validate',
  stability: 'stable',
  description: 'Validate a git command against rules',
  inputSchema: GitRulesValidateInputSchema,
  outputSchema: GitRulesValidateOutputSchema,
  handler: gitValidateTool
};
