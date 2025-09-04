import { toolDefinitions } from '../tools/index.js';
import assert from 'node:assert';

assert(toolDefinitions.find(t => t.name === 'server.info'));
assert(toolDefinitions.find(t => t.name === 'git.rules.validate'));
assert(toolDefinitions.length >= 9);
assert(toolDefinitions.find(t => t.name === 'git.rules.policy'));
assert(toolDefinitions.find(t => t.name === 'git.hooks.install'));
assert(toolDefinitions.find(t => t.name === 'git.rules.policy.markdown'));
