#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🚀 Upgrading Cloudflare Worker to include all 54 tools...');

// Backup current file
const currentFile = './lib/http-mcp-server.js';
const backupFile = './lib/http-mcp-server.backup.js';

if (fs.existsSync(currentFile)) {
  fs.copyFileSync(currentFile, backupFile);
  console.log('✅ Backed up current file to http-mcp-server.backup.js');
}

// Copy the complete version
const completeFile = './lib/http-mcp-server-complete.js';
if (fs.existsSync(completeFile)) {
  fs.copyFileSync(completeFile, currentFile);
  console.log('✅ Upgraded to complete version with all 54 tools');
} else {
  console.log('❌ Complete file not found');
  process.exit(1);
}

console.log('🎉 Upgrade complete! Your Cloudflare Worker now has all 54 tools.');
console.log('📦 Run "wrangler deploy" to deploy the updated worker.');

// Show tool count
const content = fs.readFileSync(currentFile, 'utf8');
const toolMatches = content.match(/name: '[^']+'/g);
if (toolMatches) {
  console.log(`📊 Tools detected: ${toolMatches.length}`);
}

console.log('\n🔧 Next steps:');
console.log('1. cd /Users/shubham/Desktop/my-kite-mcp-server/cloudflare');
console.log('2. wrangler deploy');
console.log('3. Test with: curl "https://YOUR_WORKER_SUBDOMAIN.YOUR_USERNAME.workers.dev/mcp/tools"');