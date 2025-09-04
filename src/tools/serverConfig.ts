import { ServerConfigInputSchema, ServerConfigOutputSchema, ApiVersion } from '../types/schemas.js';
import type { ServerConfigInput, ServerConfigOutput } from '../types/schemas.js';
import { enforcer } from './shared.js';

export async function serverConfigTool(input: ServerConfigInput): Promise<ServerConfigOutput> {
  if (input.action === 'get') {
    const c = enforcer.config;
    return { api_version: ApiVersion, data: { ...c } };
  }
  const updated = enforcer.update({
    protectedBranches: input.protectedBranches,
    featurePrefix: input.featurePrefix
  });
  return { api_version: ApiVersion, data: { ...updated } };
}

export const serverConfigDef = {
  name: 'server.config',
  stability: 'experimental',
  description: 'Get or update server configuration',
  inputSchema: ServerConfigInputSchema,
  outputSchema: ServerConfigOutputSchema,
  handler: serverConfigTool
};