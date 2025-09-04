import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import path from 'node:path';

const manifestPath = path.join(process.cwd(), 'mcp-manifest.json');

try {
  const raw = readFileSync(manifestPath, 'utf8');
  const json = JSON.parse(raw);
  assert.equal(typeof json.name, 'string');
  assert.ok(Array.isArray(json.args));
  assert.equal(json.entry.type, 'stdio');
  assert.ok(json.entry.args.length > 0);
  assert.equal(json.schema_version, 1);
  assert.equal(json.id, 'fraqtiv-git-rules');
  console.log('manifest ok');
} catch (e) {
  console.error('manifest invalid', e);
  process.exit(1);
}
