// Vercel serverless function entry point with error handling
import app from './app.js';

// For Vercel serverless, export the Express app handler
export default async function handler(req, res) {
  try {
    return await app(req, res);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: { 
        message: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      } 
    });
  }
}
