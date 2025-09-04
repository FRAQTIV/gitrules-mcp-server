import { ApiVersion, ServerInfoInputSchema, ServerInfoOutputSchema } from '../types/schemas.js';
import type { ServerInfoOutput } from '../types/schemas.js';

export async function serverInfoTool(): Promise<ServerInfoOutput> {
  const data = {
  server_version: '0.3.0',
    api_version: ApiVersion,
    tool_versions: {},
  tools: [
      { name: 'server.info', stability: 'stable' as const },
      { name: 'server.health', stability: 'stable' as const },
      { name: 'git.rules.validate', stability: 'stable' as const },
      { name: 'git.rules.status', stability: 'stable' as const },
  { name: 'git.rules.policy', stability: 'stable' as const },
  { name: 'git.hooks.install', stability: 'experimental' as const },
  { name: 'git.rules.policy.markdown', stability: 'experimental' as const },
      { name: 'git.workflow.suggest', stability: 'stable' as const },
      { name: 'git.workflow.run', stability: 'experimental' as const },
      { name: 'server.config', stability: 'experimental' as const },
      { name: 'git.rules.simulate', stability: 'experimental' as const }
  ].sort((a,b)=>a.name.localeCompare(b.name)),
    capabilities: ['format:neutral','format:markdown','transport:stdio','transport:http'],
    deprecation_notices: [
      { tool: 'git.workflow.run', alternative: 'git.rules.simulate', removal_version: '0.5.0', note: 'Replace run with explicit simulation first.' }
    ]
  };
  return { api_version: ApiVersion, data };
}

export const serverInfoDef = {
  name: 'server.info',
  stability: 'stable',
  description: 'Server version, tools & capabilities',
  inputSchema: ServerInfoInputSchema,
  outputSchema: ServerInfoOutputSchema,
  handler: async () => serverInfoTool()
};
