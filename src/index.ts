#!/usr/bin/env node
import { toolDefinitions } from './tools/index.js';
import { z } from 'zod';
import http from 'node:http';
import { markdownFormat } from './formatting/markdownFormatter.js';
import { neutralFormat } from './formatting/neutralFormatter.js';

// Simple stdio transport prototype

interface IncomingRequest { id: string | number; tool: string; input: unknown; format?: 'structured' | 'markdown'; }
interface OutgoingResponse { id: string | number; result?: unknown; error?: unknown; jsonrpc?: '2.0'; }

const toolMap = new Map(toolDefinitions.map(d => [d.name, d] as const));

const invocationCounters: Record<string, number> = {};

function logStructured(event: string, payload: Record<string, any>) {
  if (process.env.LOG_FORMAT === 'json') {
    process.stderr.write(JSON.stringify({ ts: new Date().toISOString(), event, ...payload }) + '\n');
  }
}

async function executeTool(req: IncomingRequest) {
  const def = toolMap.get(req.tool);
  if (!def) return { id: req.id, error: { api_version: '1.1.0', error: { code: 'PRECONDITION_FAILED', message: 'Unknown tool' } }};
  try {
    const validatedInput = def.inputSchema.parse(req.input);
    invocationCounters[def.name] = (invocationCounters[def.name] || 0) + 1;
    logStructured('tool_invocation', { tool: def.name, id: req.id });
    const output = await def.handler(validatedInput as any);
    const validatedOutput = def.outputSchema.parse(output);
    if (req.format && req.format !== 'structured') {
      // naive: attempt to format human summary if present or serialize data
      const base = validatedOutput as any;
      let human = base.human || JSON.stringify(base.data, null, 2);
      if (req.format === 'markdown') human = markdownFormat(human);
      else if (req.format === 'text') human = neutralFormat(human);
      base.human = human;
      return { id: req.id, result: base };
    }
    return { id: req.id, result: validatedOutput };
  } catch (err: any) {
  if (err instanceof z.ZodError) {
      return { id: req.id, error: { api_version: '1.1.0', error: { code: 'VALIDATION_FAILED', message: 'Validation error', hint: err.errors.map(e=>e.message).join('; ') } } };
    }
    return { id: req.id, error: { api_version: '1.1.0', error: { code: 'INTERNAL_ERROR', message: err?.message || 'Unknown error' } } };
  }
}

// Minimal Zod -> JSON Schema converter (covers the subset we use). If it fails, returns an empty schema.
function zodToJsonSchema(schema: any): any {
  try {
    const t = schema?._def;
    if (!t) return {};
    switch (t.typeName) {
      case 'ZodObject': {
        const shape = t.shape();
        const properties: Record<string, any> = {};
        const required: string[] = [];
        for (const key of Object.keys(shape)) {
          const child = shape[key];
            const childSchema = zodToJsonSchema(child);
          properties[key] = childSchema;
          // crude required detection: optional schemas have typeName starting with ZodOptional/ZodDefault
          if (!['ZodOptional','ZodDefault'].includes(child?._def?.typeName)) required.push(key);
        }
        return { type: 'object', properties, required };
      }
      case 'ZodString': return { type: 'string' };
      case 'ZodNumber': return { type: 'number' };
      case 'ZodBoolean': return { type: 'boolean' };
      case 'ZodLiteral': return { enum: [t.value] };
      case 'ZodEnum': return { enum: t.values };
      case 'ZodUnion': {
        // assuming union of literals for our cases
        const options = t.options?.map((o: any)=>zodToJsonSchema(o));
        if (options.every((o: any)=>o.enum && o.enum.length === 1)) {
          return { enum: options.flatMap((o: any)=>o.enum) };
        }
        return { anyOf: options };
      }
      case 'ZodDiscriminatedUnion': {
        const options = Array.from(t.options.values()).map((o: any)=>zodToJsonSchema(o));
        return { anyOf: options };
      }
      case 'ZodArray': return { type: 'array', items: zodToJsonSchema(t.type) };
      case 'ZodDefault': return zodToJsonSchema(t.innerType);
      case 'ZodOptional': { const inner = zodToJsonSchema(t.innerType); return { anyOf: [inner, { type: 'null' }] }; }
      default: return {};
    }
  } catch {
    return {};
  }
}

function mcpToolList() {
  return toolDefinitions.map(t => ({
    name: t.name,
    description: t.description || '',
    // MCP spec typically: input_schema (JSON Schema). We'll provide a best-effort derivation.
    input_schema: zodToJsonSchema(t.inputSchema),
    stability: (t as any).stability || 'stable'
  }));
}

async function executeToolCore(name: string, input: unknown, id: string | number) {
  return executeTool({ id, tool: name, input, format: 'structured' });
}

async function handleJsonRpc(obj: any): Promise<OutgoingResponse | null> {
  if (!obj || typeof obj !== 'object' || !('method' in obj)) return null;
  const id = 'id' in obj ? obj.id : undefined;
  const serverVersion = process.env.npm_package_version || '0.0.0';
  try {
    switch (obj.method) {
      case 'initialize':
        return { jsonrpc: '2.0', id, result: { name: '@fraqtiv/git-rules-mcp', version: serverVersion, capabilities: { tools: { list: true, call: true }, formats: ['structured','markdown','text'] } }};
      case 'tools/list':
        return { jsonrpc: '2.0', id, result: { tools: mcpToolList() } };
      case 'tools/call': {
        const params = obj.params || {};
        const name = params.name;
        const args = params.arguments || {};
        if (typeof name !== 'string') throw new Error('Tool name required');
        const legacy = await executeToolCore(name, args, id ?? 'call');
        if ((legacy as any).error) {
          return { jsonrpc: '2.0', id, error: { code: -32001, message: ((legacy as any).error as any).error?.message || 'Tool error', data: (legacy as any).error } } as any;
        }
        // Wrap legacy structured data into a content array if absent to align closer with MCP expectations.
        const resultPayload = (legacy as any).result;
        // If result already has data/human fields, surface directly.
        return { jsonrpc: '2.0', id, result: resultPayload };
      }
      default:
        return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } };
    }
  } catch (e: any) {
    return { jsonrpc: '2.0', id, error: { code: -32000, message: e?.message || 'Internal error' } };
  }
}

async function handleLine(line: string) {
  line = line.trim();
  if (!line) return;
  let parsed: any;
  try { parsed = JSON.parse(line); } catch (e) { return write({ id: 'unknown', error: { message: 'Invalid JSON' }} as any); }
  const rpc = await handleJsonRpc(parsed);
  if (rpc) { write(rpc); return; }
  if (parsed && typeof parsed === 'object' && 'tool' in parsed) {
    const response = await executeTool(parsed as IncomingRequest);
    write(response);
    return;
  }
  write({ id: parsed?.id || 'unknown', error: { message: 'Unsupported message shape' }} as any);
}

function write(obj: OutgoingResponse) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

let buffer = '';
// Optional auto-install of git hook if environment variable set.
if (process.env.GIT_RULES_AUTO_HOOK === '1') {
  (async () => {
    try { await executeTool({ id: 'auto-hook', tool: 'git.hooks.install', input: { force: true } }); }
    catch { /* ignore hook install errors */ }
  })();
}
process.stdin.on('data', chunk => {
  buffer += chunk.toString();
  let index;
  while ((index = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, index);
    buffer = buffer.slice(index + 1);
    handleLine(line);
  }
});

// Transport selection
const args = process.argv.slice(2);
const transportArg = args.find(a => a.startsWith('--transport='));
const transport = transportArg ? transportArg.split('=')[1] : 'stdio';

if (transport === 'http') {
  const portArg = args.find(a => a.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3030;
  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.MCP_CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const expectedToken = process.env.MCP_AUTH_TOKEN;
    if (expectedToken) {
      const auth = req.headers['authorization'];
      if (auth !== `Bearer ${expectedToken}`) { res.writeHead(401); res.end(JSON.stringify({ error: { message: 'Unauthorized' }})); return; }
    }
    if (req.method === 'POST' && req.url === '/tool') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        try {
          const parsed: IncomingRequest = JSON.parse(body);
          const response = await executeTool(parsed);
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (e: any) {
          res.writeHead(400, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: { message: e?.message || 'Bad request' }}));
        }
      });
    } else if (req.method === 'GET' && req.url === '/health') {
      const response = await executeTool({ id: 'health', tool: 'server.health', input: {} });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(response));
    } else {
      res.writeHead(404); res.end();
    }
  });
  server.listen(port, () => {
    process.stderr.write(`git-rules-mcp HTTP listening on :${port}\n`);
  });
} else if (process.stdin.isTTY) {
  (async () => {
    const response = await executeTool({ id: 'demo', tool: 'server.info', input: {} });
    process.stdout.write(JSON.stringify(response.result, null, 2) + '\n');
  })();
}
