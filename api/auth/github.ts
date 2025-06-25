import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
  
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.status(500).json({ 
      error: 'GitHub OAuth not configured',
      message: 'Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables'
    });
  }

  if (req.method === 'GET') {
    // Redirect to GitHub OAuth
    const redirectUri = `${req.headers.origin || 'http://localhost:3000'}/api/auth/github/callback`;
    const scope = 'user:email';
    const state = Math.random().toString(36).substring(7);
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    
    res.redirect(authUrl);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}