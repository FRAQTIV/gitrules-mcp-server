import assert from 'node:assert';
import { gitHooksInstallTool } from '../tools/gitHooksInstall.js';
import fs from 'node:fs';
import path from 'node:path';

const result = await gitHooksInstallTool({});
assert(result.data.path.endsWith('pre-push'));
assert(fs.existsSync(result.data.path));
const content = fs.readFileSync(result.data.path,'utf8');
assert(content.includes('Direct pushes to'));
