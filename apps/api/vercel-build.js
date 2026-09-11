// Vercel build script for API
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building API for Vercel...');

// Run Prisma generate
try {
  execSync('npx prisma generate', { 
    cwd: path.join(__dirname), 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });
  console.log('Prisma client generated');
} catch (e) {
  console.error('Prisma generate failed:', e.message);
  process.exit(1);
}

console.log('API build complete');
