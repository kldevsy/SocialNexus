// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes.js';
import { setupAuth } from '../server/replitAuth.js';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup authentication
await setupAuth(app);

// Register routes  
await registerRoutes(app);

// Export handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}