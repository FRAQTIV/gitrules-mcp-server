import { serverInfoTool } from '../tools/serverInfo.js';
import assert from 'node:assert';

const output = await serverInfoTool();
assert.strictEqual(output.api_version, '1.1.0');
assert.ok(output.data.server_version.startsWith('0.3.'));
assert.ok(output.data.tools.length >= 1);
