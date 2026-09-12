// Vercel build script for API
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building API for Vercel...');

// Prisma generate needs a DATABASE_URL, use a placeholder for build
const buildDbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public';

try {
  execSync('npx prisma generate', { 
    cwd: __dirname, 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: buildDbUrl }
  });
  console.log('Prisma client generated');
} catch (e) {
  console.error('Prisma generate failed:', e.message);
  process.exit(1);
}

console.log('API build complete');
