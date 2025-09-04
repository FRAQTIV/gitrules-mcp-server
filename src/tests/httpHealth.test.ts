import assert from 'node:assert';
import { spawn } from 'node:child_process';
import http from 'node:http';

// Basic HTTP health check test
const proc = spawn('node', ['dist/index.js','--transport=http','--port=3999']);

function get(url: string): Promise<string> { return new Promise((res, rej) => { http.get(url, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(d)); }).on('error',rej); }); }

setTimeout(async () => {
  try {
    const body = await get('http://localhost:3999/health');
    const parsed = JSON.parse(body);
    assert(parsed.id === 'health');
    assert(parsed.result?.data?.status);
  } finally {
    proc.kill();
  }
}, 400);
