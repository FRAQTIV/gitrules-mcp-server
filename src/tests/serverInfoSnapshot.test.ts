import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { serverInfoTool } from '../tools/serverInfo.js';

const snapshotPath = path.join(process.cwd(), 'src/tests/serverInfo.snapshot.json');
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
const current = await serverInfoTool();

function stable(obj: any) {
  const clone = JSON.parse(JSON.stringify(obj));
  if (clone?.data) {
    delete clone.data.tool_versions;
    if (Array.isArray(clone.data.tools)) {
      clone.data.tools = clone.data.tools.sort((a:any,b:any)=>a.name.localeCompare(b.name));
    }
  }
  return clone;
}

assert.deepStrictEqual(stable(current), stable(snapshot));