#!/usr/bin/env node
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'fs';
import { join } from 'path';

// Add shebang to the compiled index.js if it's missing
const distPath = join(process.cwd(), 'dist', 'index.js');
const binPath = join(process.cwd(), 'bin', 'mcp-git-rules');

try {
  // Ensure dist/index.js exists before reading
  if (!existsSync(distPath)) {
    console.error(`❌ dist/index.js not found at expected path: ${distPath}`);
    process.exit(2);
  }
  let content;
  try {
    content = readFileSync(distPath, 'utf8');
  } catch (error) {
    console.error(`❌ Failed to read dist/index.js at ${distPath}:`, error);
    throw error;
  }
  if (!content.startsWith('#!/usr/bin/env node')) {
    try {
      writeFileSync(distPath, '#!/usr/bin/env node\n' + content);
      console.log('✅ Added shebang to dist/index.js');
    } catch (error) {
      console.error(`❌ Failed to write shebang to dist/index.js at ${distPath}:`, error);
      throw error;
    }
  }
  
  // Make dist/index.js executable
  chmodSync(distPath, 0o755);
  // Make bin/mcp-git-rules executable if it exists
  try {
    if (existsSync(binPath)) {
      chmodSync(binPath, 0o755);
    } else {
      console.log(`⚠️  Skipped chmod: ${binPath} does not exist`);
    }
  } catch (e) {
    console.log(`⚠️  Could not chmod ${binPath}:`, e.message);
  }
  console.log('✅ Made files executable');
} catch (error) {
  console.error('❌ Postbuild failed:', error);
  process.exit(1);
}