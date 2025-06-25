import { Express } from 'express';

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'your-github-client-id';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret';
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback';

export function setupGitHubAuth(app: Express) {
  // GitHub OAuth login route
  app.get('/api/auth/github', (req, res) => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=user:email`;
    res.redirect(githubAuthUrl);
  });

  // GitHub OAuth callback route
  app.get('/api/auth/github/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.redirect('/?error=auth_failed');
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return res.redirect('/?error=token_exchange_failed');
      }

      // Get user data from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'User-Agent': 'CommunityHub-App',
        },
      });

      const userData = await userResponse.json();

      // Create session data
      const sessionData = {
        id: userData.id.toString(),
        username: userData.login,
        firstName: userData.name?.split(' ')[0] || userData.login,
        lastName: userData.name?.split(' ').slice(1).join(' ') || '',
        profileImageUrl: userData.avatar_url,
        email: userData.email,
      };

      // Set auth cookie
      const authToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');
      res.cookie('auth-token', authToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
      });

      res.redirect('/');
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      res.redirect('/?error=auth_failed');
    }
  });

  // Logout route
  app.get('/api/logout', (req, res) => {
    res.clearCookie('auth-token');
    res.redirect('/');
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('auth-token');
    res.json({ success: true });
  });

  // Get current user route
  app.get('/api/auth/user', (req, res) => {
    const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
    
    if (!authCookie) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const userData = JSON.parse(Buffer.from(authCookie.split('=')[1], 'base64').toString());
      res.json(userData);
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  });
}

export const requireAuth = (req: any, res: any, next: any) => {
  const authCookie = req.headers.cookie?.split(';').find((c: string) => c.trim().startsWith('auth-token='));
  
  if (!authCookie) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const userData = JSON.parse(Buffer.from(authCookie.split('=')[1], 'base64').toString());
    req.user = userData;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authentication' });
  }
};