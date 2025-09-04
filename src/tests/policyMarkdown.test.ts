import assert from 'node:assert';
import { gitRulesPolicyMarkdownTool } from '../tools/gitPolicyMarkdown.js';

const r = await gitRulesPolicyMarkdownTool();
assert(r.data.markdown.startsWith('# Git Rules'));
assert(r.data.markdown.includes('Branch Model'));
