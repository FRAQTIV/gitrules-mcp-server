#!/usr/bin/env node
import { toolDefinitions } from './tools/index.js';
import { z } from 'zod';
import http from 'node:http';
import { markdownFormat } from './formatting/markdownFormatter.js';
import { neutralFormat } from './formatting/neutralFormatter.js';

// Simple stdio transport prototype

interface IncomingRequest { id: string; tool: string; input: unknown; format?: 'structured' | 'markdown'; }
interface OutgoingResponse { id: string; result?: unknown; error?: unknown; }

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

async function handleLine(line: string) {
  line = line.trim();
  if (!line) return;
  let parsed: IncomingRequest;
  try { parsed = JSON.parse(line); } catch (e) { return write({ id: 'unknown', error: { message: 'Invalid JSON' }}); }
  const response = await executeTool(parsed);
  write(response);
}

function write(obj: OutgoingResponse) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

let buffer = '';
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
