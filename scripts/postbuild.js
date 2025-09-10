#!/usr/bin/env node
import { readFileSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';

// Add shebang to the compiled index.js if it's missing
const distPath = join(process.cwd(), 'dist', 'index.js');
const binPath = join(process.cwd(), 'bin', 'mcp-git-rules');

try {
  // Ensure dist/index.js has shebang
  const content = readFileSync(distPath, 'utf8');
  if (!content.startsWith('#!/usr/bin/env node')) {
    writeFileSync(distPath, '#!/usr/bin/env node\n' + content);
    console.log('✅ Added shebang to dist/index.js');
  }
  
  // Make both files executable
  chmodSync(distPath, 0o755);
  chmodSync(binPath, 0o755);
  console.log('✅ Made files executable');
} catch (error) {
  console.error('❌ Postbuild failed:', error);
  process.exit(1);
}