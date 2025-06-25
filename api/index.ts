// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

// Create app instance per request for serverless
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = express();
    
    // Middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // CORS for Vercel
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });

    // Simple auth check for Vercel (without Replit OAuth)
    app.get('/api/auth/user', (req, res) => {
      res.status(401).json({ message: 'Authentication not configured for production yet' });
    });

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Basic routes for testing
    app.get('/api/servers', (req, res) => {
      res.json([]);
    });

    app.post('/api/servers', (req, res) => {
      res.status(401).json({ message: 'Authentication required' });
    });

    // Handle the request
    return app(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}