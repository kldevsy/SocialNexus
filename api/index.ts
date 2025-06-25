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
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
      res.header('Access-Control-Allow-Credentials', 'true');
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
        
        // Convert GitHub user to expected format
        const user = {
          id: userData.id,
          email: userData.email,
          firstName: userData.username || 'User',
          lastName: '',
          profileImageUrl: userData.avatar,
          username: userData.username,
          bio: null,
          status: '🟢 Online',
          customStatus: null,
          theme: 'light',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        res.json(user);
      } catch (error) {
        res.status(401).json({ message: 'Invalid authentication' });
      }
    });

    // GitHub OAuth routes
    app.get('/api/auth/github', (req, res) => {
      const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
      
      if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return res.status(500).json({ 
          error: 'GitHub OAuth not configured',
          message: 'Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables'
        });
      }

      // Redirect to GitHub OAuth
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const redirectUri = `${protocol}://${host}/api/auth/github/callback`;
      const scope = 'user:email';
      const state = Math.random().toString(36).substring(7);
      
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
      
      res.redirect(authUrl);
    });

    app.get('/api/auth/github/callback', async (req, res) => {
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

        // Create simple session
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
    });

    // Login route - redirect to GitHub OAuth
    app.get('/api/login', (req, res) => {
      const { GITHUB_CLIENT_ID } = process.env;
      
      if (!GITHUB_CLIENT_ID) {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Login Setup Required</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              .container { background: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0; }
              .step { background: white; margin: 15px 0; padding: 20px; border-radius: 6px; border-left: 4px solid #0969da; }
              code { background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
              .success { color: #0969da; font-weight: bold; }
              h1 { color: #24292f; }
              h2 { color: #656d76; font-size: 18px; }
            </style>
          </head>
          <body>
            <h1>🚀 Configurar Login GitHub</h1>
            <div class="container">
              <p>Para ativar o login, siga estes passos:</p>
              
              <div class="step">
                <h2>1. Criar GitHub OAuth App</h2>
                <p>Vá para <a href="https://github.com/settings/applications/new" target="_blank">GitHub Developer Settings</a></p>
                <p>Preencha:</p>
                <ul>
                  <li><strong>Application name:</strong> CommunityHub</li>
                  <li><strong>Homepage URL:</strong> <code>https://seu-projeto.vercel.app</code></li>
                  <li><strong>Authorization callback URL:</strong> <code>https://seu-projeto.vercel.app/api/auth/github/callback</code></li>
                </ul>
              </div>
              
              <div class="step">
                <h2>2. Copiar Credenciais</h2>
                <p>Após criar o app, copie:</p>
                <ul>
                  <li><strong>Client ID</strong></li>
                  <li><strong>Client Secret</strong></li>
                </ul>
              </div>
              
              <div class="step">
                <h2>3. Configurar no Vercel</h2>
                <p>No dashboard do Vercel, vá em <strong>Settings → Environment Variables</strong></p>
                <p>Adicione:</p>
                <ul>
                  <li><code>GITHUB_CLIENT_ID</code> = seu client id</li>
                  <li><code>GITHUB_CLIENT_SECRET</code> = seu client secret</li>
                </ul>
              </div>
              
              <div class="step">
                <h2>4. Redeploy</h2>
                <p>O Vercel fará redeploy automático após adicionar as variáveis.</p>
                <p class="success">✅ Login funcionará automaticamente!</p>
              </div>
            </div>
            
            <p><a href="/">← Voltar ao site</a></p>
            
            <script>
              // Auto refresh every 30 seconds to check if configured
              setTimeout(() => {
                fetch('/api/login').then(r => r.text()).then(html => {
                  if (!html.includes('Configurar Login')) {
                    window.location.href = '/api/login';
                  }
                });
              }, 30000);
            </script>
          </body>
          </html>
        `);
      }

      res.redirect('/api/auth/github');
    });

    // Logout route - handle both GET and POST
    app.get('/api/logout', (req, res) => {
      res.setHeader('Set-Cookie', [
        'auth-token=; HttpOnly; Path=/; Max-Age=0'
      ]);
      res.redirect('/');
    });

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

    // Server routes with authentication check
    app.get('/api/servers', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Return user servers (demo data for now)
      res.json([
        {
          id: 1,
          name: 'Meu Servidor',
          description: 'Servidor pessoal para testes',
          category: 'Geral',
          isPublic: true,
          ownerId: 'user-123',
          memberCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          owner: { 
            id: 'user-123', 
            username: 'Você',
            firstName: 'Você',
            lastName: '',
            profileImageUrl: null
          }
        }
      ]);
    });

    app.get('/api/servers/discover', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Return public servers for discovery
      res.json([
        {
          id: 2,
          name: 'Servidor Gaming',
          description: 'Comunidade para gamers',
          category: 'Gaming',
          isPublic: true,
          ownerId: 'owner-456',
          memberCount: 150,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          owner: { 
            id: 'owner-456', 
            username: 'GameMaster',
            firstName: 'Game',
            lastName: 'Master',
            profileImageUrl: null
          }
        },
        {
          id: 3,
          name: 'Tech Community',
          description: 'Discussões sobre tecnologia',
          category: 'Tecnologia',
          isPublic: true,
          ownerId: 'owner-789',
          memberCount: 89,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          owner: { 
            id: 'owner-789', 
            username: 'TechGuru',
            firstName: 'Tech',
            lastName: 'Guru',
            profileImageUrl: null
          }
        }
      ]);
    });

    app.post('/api/servers', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required to create servers' });
      }

      try {
        const userData = JSON.parse(Buffer.from(authCookie.split('=')[1], 'base64').toString());
        const { name, description, category, isPublic } = req.body;
        
        // Create new server (demo response)
        const newServer = {
          id: Date.now(),
          name: name || 'Novo Servidor',
          description: description || '',
          category: category || 'Geral',
          isPublic: isPublic !== false,
          ownerId: userData.id,
          memberCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          owner: {
            id: userData.id,
            username: userData.username,
            firstName: userData.username,
            lastName: '',
            profileImageUrl: userData.avatar
          }
        };
        
        res.status(201).json(newServer);
      } catch (error) {
        res.status(400).json({ message: 'Invalid request data' });
      }
    });

    // User profile routes
    app.patch('/api/user', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const userData = JSON.parse(Buffer.from(authCookie.split('=')[1], 'base64').toString());
        const updates = req.body;
        
        // Update user data (demo response)
        const updatedUser = {
          id: userData.id,
          email: userData.email,
          firstName: updates.firstName || userData.username,
          lastName: updates.lastName || '',
          profileImageUrl: userData.avatar,
          username: userData.username,
          bio: updates.bio || null,
          status: updates.status || '🟢 Online',
          customStatus: updates.customStatus || null,
          theme: updates.theme || 'light',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        res.json(updatedUser);
      } catch (error) {
        res.status(400).json({ message: 'Invalid request data' });
      }
    });

    // Server details route
    app.get('/api/servers/:id', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const serverId = parseInt(req.params.id);
      
      // Demo server with channels
      const server = {
        id: serverId,
        name: serverId === 1 ? 'Meu Servidor' : 'Servidor Gaming',
        description: serverId === 1 ? 'Servidor pessoal para testes' : 'Comunidade para gamers',
        category: serverId === 1 ? 'Geral' : 'Gaming',
        isPublic: true,
        ownerId: 'user-123',
        memberCount: serverId === 1 ? 5 : 150,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: { 
          id: 'user-123', 
          username: serverId === 1 ? 'Você' : 'GameMaster',
          firstName: serverId === 1 ? 'Você' : 'Game',
          lastName: serverId === 1 ? '' : 'Master',
          profileImageUrl: null
        },
        channels: [
          {
            id: 1,
            name: 'geral',
            description: 'Canal principal',
            type: 'text',
            serverId: serverId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            name: 'chat-voz',
            description: 'Canal de voz',
            type: 'voice',
            serverId: serverId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      };
      
      res.json(server);
    });

    // Channel messages route
    app.get('/api/channels/:id/messages', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const channelId = parseInt(req.params.id);
      
      // Demo messages
      const messages = [
        {
          id: 1,
          content: 'Bem-vindos ao servidor!',
          imageUrl: null,
          embedData: null,
          authorId: 'user-123',
          channelId: channelId,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          author: {
            id: 'user-123',
            username: 'Admin',
            firstName: 'Admin',
            lastName: '',
            profileImageUrl: null
          }
        },
        {
          id: 2,
          content: 'Olá pessoal! Como estão?',
          imageUrl: null,
          embedData: null,
          authorId: 'user-456',
          channelId: channelId,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
          author: {
            id: 'user-456',
            username: 'Membro',
            firstName: 'Membro',
            lastName: 'Ativo',
            profileImageUrl: null
          }
        }
      ];
      
      res.json(messages);
    });

    // Post message route
    app.post('/api/messages', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const userData = JSON.parse(Buffer.from(authCookie.split('=')[1], 'base64').toString());
        const { content, channelId, imageUrl, embedData } = req.body;
        
        const newMessage = {
          id: Date.now(),
          content: content || '',
          imageUrl: imageUrl || null,
          embedData: embedData || null,
          authorId: userData.id,
          channelId: parseInt(channelId),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            id: userData.id,
            username: userData.username,
            firstName: userData.username,
            lastName: '',
            profileImageUrl: userData.avatar
          }
        };
        
        res.status(201).json(newMessage);
      } catch (error) {
        res.status(400).json({ message: 'Invalid request data' });
      }
    });

    // Join server route
    app.post('/api/servers/:id/join', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const serverId = parseInt(req.params.id);
      
      res.json({
        message: 'Successfully joined server',
        serverId: serverId,
        joinedAt: new Date().toISOString()
      });
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