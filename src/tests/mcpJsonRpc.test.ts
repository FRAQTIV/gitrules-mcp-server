import assert from 'node:assert';
import { spawn } from 'node:child_process';

// This test exercises the stdio JSON-RPC interface implementing MCP compatibility.

function spawnServer() {
	return spawn('node', ['dist/index.js'], { stdio: ['pipe','pipe','pipe'] });
}

function send(proc: any, msg: any) { proc.stdin.write(JSON.stringify(msg) + '\n'); }

async function readOne(proc: any, timeoutMs = 1500): Promise<any> {
	return new Promise((resolve, reject) => {
		let buf = '';
		const onData = (chunk: any) => {
			buf += chunk.toString();
			let idx;
			while ((idx = buf.indexOf('\n')) >= 0) {
				const line = buf.slice(0, idx).trim();
				buf = buf.slice(idx + 1);
				if (!line) continue;
				proc.stdout.off('data', onData);
				try { return resolve(JSON.parse(line)); } catch (e) { return reject(e); }
			}
		};
		proc.stdout.on('data', onData);
		const to = setTimeout(() => {
			proc.stdout.off('data', onData);
			reject(new Error('Timeout waiting for server response'));
		}, timeoutMs);
		// ensure cleanup if promise resolves early
		(resolve as any).finally?.(()=>clearTimeout(to));
	});
}

const proc = spawnServer();

// initialize
send(proc, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { capabilities: {} } });
const init = await readOne(proc);
assert.strictEqual(init.id, 1);
assert(init.result?.name?.includes('@fraqtiv/git-rules-mcp'));

// list tools
send(proc, { jsonrpc: '2.0', id: 2, method: 'tools/list' });
const list = await readOne(proc);
assert(Array.isArray(list.result?.tools));
assert(list.result.tools.find((t: any)=>t.name === 'server.info'));
assert(list.result.tools.every((t: any)=>'input_schema' in t));

// call server.info
send(proc, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'server.info', arguments: {} } });
const call = await readOne(proc);
assert(call.result?.data?.server_version);

// legacy protocol message
send(proc, { id: 'legacy1', tool: 'server.info', input: {} });
const legacy = await readOne(proc);
assert.strictEqual(legacy.id, 'legacy1');
assert(legacy.result?.data?.server_version);

proc.kill();

