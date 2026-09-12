// Vercel API entry point
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the Express app from apps/api
const appModule = await import(join(__dirname, 'apps/api/src/app.js'));
const app = appModule.default;

// For Vercel serverless, export the Express app handler
export default function handler(req, res) {
  return app(req, res);
}
