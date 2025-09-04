import { toolDefinitions } from '../tools/index.js';
import assert from 'node:assert';

assert(toolDefinitions.find(t => t.name === 'server.info'));
assert(toolDefinitions.find(t => t.name === 'git.rules.validate'));
assert(toolDefinitions.length >= 6);
