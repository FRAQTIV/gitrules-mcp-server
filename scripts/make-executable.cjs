#!/usr/bin/env node
// Ensure bin scripts are executable after install/build (esp. when published from some OSes)
const { chmodSync, existsSync } = require('node:fs');
const bins = [
  'bin/mcp-git-rules',
  'bin/fraqtiv-git-rules',
  'bin/git-rules-mcp'
];
for (const b of bins) {
  if (existsSync(b)) {
    try { chmodSync(b, 0o755); process.stderr.write(`[make-executable] chmod +x ${b}\n`); } catch (e) { /* ignore */ }
  }
}
