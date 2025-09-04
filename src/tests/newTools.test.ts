import assert from 'node:assert';
import { serverConfigTool } from '../tools/serverConfig.js';
import { gitSimulateTool } from '../tools/gitSimulate.js';

const cfg = await serverConfigTool({ action: 'get' });
assert(cfg.data.protectedBranches.length >= 1);

const sim = await gitSimulateTool({ sequence: [{ command: 'commit' }, { command: 'push' }], stopOnViolation: false });
assert(sim.data.results.length === 2);