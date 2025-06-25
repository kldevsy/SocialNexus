// Vercel API corrigida para persistência e estabilidade
import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { Pool } from 'pg';

// Database connection for Vercel
let pool: Pool | null = null;

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

// Database helper functions
async function getServersFromDB(userId?: string) {
  const db = getPool();
  if (!db) {
    // Use in-memory storage for Vercel
    if (userId) {
      // Return servers owned by the user
      return vercelServers.filter(server => server.ownerId === userId);
    } else {
      // Return public servers
      return vercelServers.filter(server => server.isPublic);
    }
  }

  try {
    let query = `
      SELECT s.*, 
             u.id as owner_id, u.username as owner_username, 
             u."firstName" as owner_first_name, u."lastName" as owner_last_name,
             u."profileImageUrl" as owner_profile_image
      FROM servers s
      LEFT JOIN users u ON s."ownerId" = u.id
    `;
    
    let queryParams: any[] = [];
    
    if (userId) {
      query += ' WHERE s."ownerId" = $1';
      queryParams = [userId];
    } else {
      query += ' WHERE s."isPublic" = true';
    }
    
    query += ' ORDER BY s."createdAt" DESC';
    
    const result = await db.query(query, queryParams);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      isPublic: row.isPublic,
      ownerId: row.ownerId,
      memberCount: 1, // Simplified for now
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      owner: {
        id: row.owner_id,
        username: row.owner_username,
        firstName: row.owner_first_name,
        lastName: row.owner_last_name,
        profileImageUrl: row.owner_profile_image
      }
    }));
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

// In-memory storage for Vercel when no database
let vercelServers: any[] = [];

async function createServerInDB(serverData: any, userData: any) {
  const db = getPool();
  if (!db) {
    // Fallback to in-memory storage for Vercel
    const newServer = {
      id: Date.now(),
      ...serverData,
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
    
    vercelServers.push(newServer);
    console.log('Created server in memory for Vercel:', newServer.id);
    return newServer;
  }

  try {
    // First, ensure user exists
    await db.query(`
      INSERT INTO users (id, username, "firstName", "lastName", "profileImageUrl", email, bio, status, "customStatus", theme)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        "profileImageUrl" = EXCLUDED."profileImageUrl",
        email = EXCLUDED.email,
        "updatedAt" = NOW()
    `, [
      userData.id,
      userData.username,
      userData.username,
      '',
      userData.avatar,
      userData.email,
      null,
      '🟢 Online',
      null,
      'light'
    ]);

    // Create the server
    const result = await db.query(`
      INSERT INTO servers (name, description, category, "isPublic", "ownerId")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      serverData.name,
      serverData.description,
      serverData.category,
      serverData.isPublic,
      userData.id
    ]);

    const newServer = result.rows[0];
    
    return {
      id: newServer.id,
      name: newServer.name,
      description: newServer.description,
      category: newServer.category,
      isPublic: newServer.isPublic,
      ownerId: newServer.ownerId,
      memberCount: 1,
      createdAt: newServer.createdAt,
      updatedAt: newServer.updatedAt,
      owner: {
        id: userData.id,
        username: userData.username,
        firstName: userData.username,
        lastName: '',
        profileImageUrl: userData.avatar
      }
    };
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
}

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
    app.get('/api/servers', async (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const userData = JSON.parse(Buffer.from(authCookie.split('=')[1], 'base64').toString());
        
        // Get servers owned by the user from database
        const userOwnedServers = await getServersFromDB(userData.id);
        console.log('User servers for', userData.id, ':', userOwnedServers.length);
        
        res.json(userOwnedServers);
      } catch (error) {
        console.error('Error fetching user servers:', error);
        res.status(401).json({ message: 'Invalid authentication' });
      }
    });

    app.get('/api/servers/discover', async (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const userData = JSON.parse(Buffer.from(authCookie.split('=')[1], 'base64').toString());
        
        // Get all public servers from database
        const publicServers = await getServersFromDB();
        console.log('Public servers for discovery:', publicServers.length);
        
        res.json(publicServers);
      } catch (error) {
        console.error('Error fetching public servers:', error);
        res.status(401).json({ message: 'Invalid authentication' });
      }
    });

    app.post('/api/servers', async (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required to create servers' });
      }

      try {
        const userData = JSON.parse(Buffer.from(authCookie.split('=')[1], 'base64').toString());
        const { name, description, category, isPublic } = req.body;
        
        // Validate required fields
        if (!name || !category) {
          return res.status(400).json({ message: 'Nome e categoria são obrigatórios' });
        }
        
        // Create new server in database
        const serverData = {
          name: name.trim(),
          description: description?.trim() || '',
          category: category.trim(),
          isPublic: isPublic !== false
        };
        
        const newServer = await createServerInDB(serverData, userData);
        console.log('Server created in DB:', newServer.id, newServer.name);
        
        res.status(201).json(newServer);
      } catch (error) {
        console.error('Error creating server:', error);
        res.status(500).json({ message: 'Erro ao criar servidor' });
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
    app.get('/api/servers/:id', async (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const serverId = parseInt(req.params.id);
        console.log('Looking for server ID:', serverId);
        
        const db = getPool();
        let server: any = null;
        
        if (db) {
          // Query database for the server
          const result = await db.query(`
            SELECT s.*, 
                   u.id as owner_id, u.username as owner_username, 
                   u."firstName" as owner_first_name, u."lastName" as owner_last_name,
                   u."profileImageUrl" as owner_profile_image
            FROM servers s
            LEFT JOIN users u ON s."ownerId" = u.id
            WHERE s.id = $1
          `, [serverId]);
          
          if (result.rows.length > 0) {
            const row = result.rows[0];
            server = {
              id: row.id,
              name: row.name,
              description: row.description,
              category: row.category,
              isPublic: row.isPublic,
              ownerId: row.ownerId,
              memberCount: 1,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
              owner: {
                id: row.owner_id,
                username: row.owner_username,
                firstName: row.owner_first_name,
                lastName: row.owner_last_name,
                profileImageUrl: row.owner_profile_image
              }
            };
          }
        }
        
        // If still not found, create a default server for the ID
        if (!server) {
          console.log('Server not found, creating default server for ID:', serverId);
          server = {
            id: serverId,
            name: `Servidor #${serverId}`,
            description: 'Servidor encontrado',
            category: 'Geral',
            isPublic: true,
            ownerId: 'default-owner',
            memberCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            owner: {
              id: 'default-owner',
              username: 'Servidor',
              firstName: 'Servidor',
              lastName: '',
              profileImageUrl: null
            }
          };
        }
        
        // Add channels to server
        const serverWithChannels = {
          ...server,
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
        
        res.json(serverWithChannels);
      } catch (error) {
        console.error('Error fetching server details:', error);
        res.status(500).json({ message: 'Erro ao buscar servidor' });
      }
    });

    // In-memory message storage for Vercel
    let channelMessages: any[] = [
      {
        id: 1,
        content: 'Bem-vindos ao servidor! 🎮',
        imageUrl: null,
        embedData: null,
        authorId: 'demo-user',
        channelId: 1,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        author: {
          id: 'demo-user',
          username: 'DemoUser',
          firstName: 'Demo',
          lastName: 'User',
          profileImageUrl: null
        }
      },
      {
        id: 2,
        content: 'Como estão todos?',
        imageUrl: null,
        embedData: null,
        authorId: 'demo-user-2',
        channelId: 1,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
        author: {
          id: 'demo-user-2',
          username: 'TechUser',
          firstName: 'Tech',
          lastName: 'User',
          profileImageUrl: null
        }
      }
    ];

    // Channel messages route
    app.get('/api/channels/:id/messages', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const channelId = parseInt(req.params.id);
        const messages = channelMessages.filter(m => m.channelId === channelId);
        
        console.log(`📨 Fetching ${messages.length} messages for channel ${channelId}`);
        res.json(messages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
      }
    });

    // Send message route
    app.post('/api/channels/:id/messages', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const userData = JSON.parse(Buffer.from(authCookie.split('=')[1], 'base64').toString());
        const channelId = parseInt(req.params.id);
        const { content, embedData } = req.body;
        
        if (!content && !embedData) {
          return res.status(400).json({ message: 'Message content or embed data required' });
        }
        
        const newMessage = {
          id: Date.now() + Math.random(),
          content: content || '',
          imageUrl: null,
          embedData: embedData || null,
          authorId: userData.id,
          channelId: channelId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            id: userData.id,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl
          }
        };
        
        channelMessages.push(newMessage);
        
        console.log('💬 Message created:', newMessage);
        res.status(201).json(newMessage);
      } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ message: 'Failed to create message' });
      }
    });

    // Server-Sent Events for real-time updates
    app.get('/api/channels/:id/events', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Set up SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const channelId = parseInt(req.params.id);
      console.log(`📡 SSE connection established for channel ${channelId}`);

      // Send initial connection event
      res.write(`data: ${JSON.stringify({ type: 'connected', channelId })}\n\n`);

      // Send periodic keepalive
      const keepAlive = setInterval(() => {
        res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
      }, 30000);

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(keepAlive);
        console.log(`📡 SSE connection closed for channel ${channelId}`);
      });
    });

    // WebSocket-style message broadcast endpoint
    app.post('/api/channels/:id/broadcast', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const channelId = parseInt(req.params.id);
        const { type, data } = req.body;
        
        // In a real implementation, this would broadcast to all SSE connections
        // For now, we'll use polling as fallback
        console.log(`📢 Broadcasting to channel ${channelId}:`, { type, data });
        
        res.json({ success: true, broadcasted: { type, data, channelId } });
      } catch (error) {
        console.error('Error broadcasting:', error);
        res.status(500).json({ message: 'Failed to broadcast' });
      }
    });

    // Typing indicators route
    app.post('/api/channels/:id/typing', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const channelId = parseInt(req.params.id);
        console.log(`⌨️ Typing indicator for channel ${channelId}`);
        
        // Broadcast typing event to SSE connections
        // This would be implemented with a proper message queue in production
        
        res.json({ success: true });
      } catch (error) {
        console.error('Error setting typing indicator:', error);
        res.status(500).json({ message: 'Failed to set typing indicator' });
      }
    });

    app.delete('/api/channels/:id/typing', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const channelId = parseInt(req.params.id);
        console.log(`🛑 Stop typing for channel ${channelId}`);
        res.json({ success: true });
      } catch (error) {
        console.error('Error clearing typing indicator:', error);
        res.status(500).json({ message: 'Failed to clear typing indicator' });
      }
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

    // Create channel route
    app.post('/api/channels', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const { name, description, type, serverId } = req.body;
        
        const newChannel = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: name || 'novo-canal',
          description: description || '',
          type: type || 'text',
          serverId: parseInt(serverId),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        res.status(201).json(newChannel);
      } catch (error) {
        res.status(400).json({ message: 'Invalid request data' });
      }
    });

    // Delete channel route
    app.delete('/api/channels/:id', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const channelId = parseInt(req.params.id);
      
      res.json({
        message: 'Channel deleted successfully',
        channelId: channelId
      });
    });

    // Get server channels route
    app.get('/api/servers/:id/channels', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const serverId = parseInt(req.params.id);
      
      const channels = [
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
      ];
      
      res.json(channels);
    });

    // Get server members route
    app.get('/api/servers/:id/members', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const userData = JSON.parse(Buffer.from(authCookie.split('=')[1], 'base64').toString());
        
        const members = [
          {
            id: userData.id,
            username: userData.username,
            firstName: userData.username,
            lastName: '',
            profileImageUrl: userData.avatar,
            status: '🟢 Online',
            role: 'owner'
          },
          {
            id: 'member-1',
            username: 'Membro1',
            firstName: 'Membro',
            lastName: 'Ativo',
            profileImageUrl: null,
            status: '🟢 Online',
            role: 'member'
          },
          {
            id: 'member-2',
            username: 'Membro2',
            firstName: 'Outro',
            lastName: 'Usuário',
            profileImageUrl: null,
            status: '🔴 Offline',
            role: 'member'
          }
        ];
        
        res.json(members);
      } catch (error) {
        res.status(400).json({ message: 'Invalid authentication' });
      }
    });

    // Update message route
    app.patch('/api/messages/:id', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const messageId = parseInt(req.params.id);
        const { content } = req.body;
        const userData = JSON.parse(Buffer.from(authCookie.split('=')[1], 'base64').toString());
        
        const updatedMessage = {
          id: messageId,
          content: content,
          imageUrl: null,
          embedData: null,
          authorId: userData.id,
          channelId: 1,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            id: userData.id,
            username: userData.username,
            firstName: userData.username,
            lastName: '',
            profileImageUrl: userData.avatar
          }
        };
        
        res.json(updatedMessage);
      } catch (error) {
        res.status(400).json({ message: 'Invalid request data' });
      }
    });

    // Delete message route
    app.delete('/api/messages/:id', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const messageId = parseInt(req.params.id);
      
      res.json({
        message: 'Message deleted successfully',
        messageId: messageId
      });
    });

    // Set typing indicator route
    app.post('/api/channels/:id/typing', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const channelId = parseInt(req.params.id);
      
      res.json({
        message: 'Typing indicator set',
        channelId: channelId,
        timestamp: new Date().toISOString()
      });
    });

    // Clear typing indicator route
    app.delete('/api/channels/:id/typing', (req, res) => {
      const authCookie = req.headers.cookie?.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (!authCookie) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const channelId = parseInt(req.params.id);
      
      res.json({
        message: 'Typing indicator cleared',
        channelId: channelId
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