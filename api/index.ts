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

    // Auth routes for Vercel
    app.get('/api/auth/user', (req, res) => {
      try {
        const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
        
        if (!authCookie) {
          return res.status(401).json({ message: 'Not authenticated' });
        }

        const tokenValue = authCookie.split('=')[1];
        const userData = JSON.parse(Buffer.from(tokenValue, 'base64').toString());
        
        res.json(userData);
      } catch (error) {
        res.status(401).json({ message: 'Invalid authentication' });
      }
    });

    // Login route - redirect to GitHub OAuth
    app.get('/api/login', (req, res) => {
      const { GITHUB_CLIENT_ID } = process.env;
      
      if (!GITHUB_CLIENT_ID) {
        return res.json({ 
          message: 'GitHub OAuth not configured. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.',
          loginMethods: ['GitHub OAuth (configuration needed)'],
          status: 'configuration_required'
        });
      }

      res.redirect('/api/auth/github');
    });

    // Logout route
    app.post('/api/logout', (req, res) => {
      res.setHeader('Set-Cookie', [
        'auth-token=; HttpOnly; Path=/; Max-Age=0'
      ]);
      res.json({ message: 'Logged out successfully' });
    });

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Basic routes for testing
    app.get('/api/servers', (req, res) => {
      res.json([
        {
          id: 1,
          name: 'Demo Server',
          description: 'A demo server for testing',
          category: 'General',
          isPublic: true,
          owner: { id: 'demo', username: 'Demo User' }
        }
      ]);
    });

    app.post('/api/servers', (req, res) => {
      res.status(401).json({ message: 'Authentication required to create servers' });
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