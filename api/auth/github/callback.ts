import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query;
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
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
      return res.status(400).json({ error: tokenData.error_description });
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
      },
    });

    const userData = await userResponse.json();

    // Create simple session (in production, use proper session management)
    const userSession = {
      id: userData.id.toString(),
      username: userData.login,
      email: userData.email,
      avatar: userData.avatar_url,
      provider: 'github'
    };

    // Set session cookie
    res.setHeader('Set-Cookie', [
      `auth-token=${Buffer.from(JSON.stringify(userSession)).toString('base64')}; HttpOnly; Path=/; Max-Age=604800; ${process.env.NODE_ENV === 'production' ? 'Secure; SameSite=Strict' : ''}`
    ]);

    // Redirect to app
    res.redirect('/');
    
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}