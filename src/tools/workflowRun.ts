import { ApiVersion, GitWorkflowRunInputSchema, GitWorkflowRunOutputSchema } from '../types/schemas.js';
import type { GitWorkflowRunInput, GitWorkflowRunOutput } from '../types/schemas.js';
import { workflowHelper } from './shared.js';

export async function workflowRunTool(input: GitWorkflowRunInput): Promise<GitWorkflowRunOutput> {
  const data = workflowHelper.run(input.workflow);
  return { api_version: ApiVersion, data };
}

export const workflowRunDef = {
  name: 'git.workflow.run',
  stability: 'experimental',
  description: 'Execute a workflow (not implemented)',
  inputSchema: GitWorkflowRunInputSchema,
  outputSchema: GitWorkflowRunOutputSchema,
  handler: workflowRunTool
};
