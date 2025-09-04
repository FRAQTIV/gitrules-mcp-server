import { ApiVersion, GitWorkflowSuggestInputSchema, GitWorkflowSuggestOutputSchema } from '../types/schemas.js';
import type { GitWorkflowSuggestInput, GitWorkflowSuggestOutput } from '../types/schemas.js';
import { workflowHelper } from './shared.js';

export async function workflowSuggestTool(input: GitWorkflowSuggestInput): Promise<GitWorkflowSuggestOutput> {
  const data = workflowHelper.suggest(input.task);
  return { api_version: ApiVersion, data };
}

export const workflowSuggestDef = {
  name: 'git.workflow.suggest',
  stability: 'stable',
  description: 'Suggest steps for a workflow task',
  inputSchema: GitWorkflowSuggestInputSchema,
  outputSchema: GitWorkflowSuggestOutputSchema,
  handler: workflowSuggestTool
};
