import { GitRulesSimulateInputSchema, GitRulesSimulateOutputSchema, ApiVersion } from '../types/schemas.js';
import type { GitRulesSimulateInput, GitRulesSimulateOutput } from '../types/schemas.js';
import { enforcer } from './shared.js';

export async function gitSimulateTool(input: GitRulesSimulateInput): Promise<GitRulesSimulateOutput> {
  const results = [] as any[];
  let firstViolation: string | null = null;
  for (const step of input.sequence) {
    const r = enforcer.validate(step.command, step.args || []);
    results.push({ command: step.command, allowed: r.allowed, severity: r.severity, reason: r.reason });
    if (!r.allowed && !firstViolation) {
      firstViolation = step.command;
      if (input.stopOnViolation) break;
    }
  }
  return { api_version: ApiVersion, data: { results, firstViolation } };
}

export const gitSimulateDef = {
  name: 'git.rules.simulate',
  stability: 'experimental',
  description: 'Simulate a sequence of git commands against policy',
  inputSchema: GitRulesSimulateInputSchema,
  outputSchema: GitRulesSimulateOutputSchema,
  handler: gitSimulateTool
};