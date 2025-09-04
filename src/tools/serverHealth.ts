import { ApiVersion, ServerHealthInputSchema, ServerHealthOutputSchema } from '../types/schemas.js';
import type { ServerHealthOutput } from '../types/schemas.js';

const metrics = { validate_calls: 0, suggest_calls: 0, last_error_timestamp: null as number|null };

export async function serverHealthTool(): Promise<ServerHealthOutput> {
  const checks = [
    { name: 'process.uptime', status: 'ok' as const, detail: `${process.uptime().toFixed(1)}s` },
    { name: 'repo.access', status: 'degraded' as const, detail: 'not_implemented' }
  ];
  const status = checks.some(c => c.status === 'degraded') ? 'degraded' : 'ok';
  return {
    api_version: ApiVersion,
    data: {
      status,
      timestamp: new Date().toISOString(),
      checks,
      metrics
    }
  };
}

export const serverHealthDef = {
  name: 'server.health',
  stability: 'stable',
  description: 'Server health & metrics',
  inputSchema: ServerHealthInputSchema,
  outputSchema: ServerHealthOutputSchema,
  handler: async () => serverHealthTool()
};

export { metrics };
