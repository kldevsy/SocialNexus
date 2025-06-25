import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Database connection with robust error handling
let pool: Pool | null = null;

function initDatabase() {
  if (!pool && process.env.DATABASE_URL) {
    try {
      console.log('Initializing database connection for Vercel...');
      
      // For Vercel + Supabase/Neon, always use SSL
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
      });
      
      console.log('Database pool created successfully');
      
    } catch (error) {
      console.error('Failed to initialize database:', error);
      pool = null;
    }
  }
  return pool;
}

// In-memory storage as fallback
let memoryStorage = {
  users: new Map(),
  servers: new Map(),
  serverIdCounter: 1
};

// Helper functions
function getAuthUser(req: VercelRequest) {
  // Simulate authenticated user for demo
  return {
    id: `demo-user-${Date.now()}`,
    username: 'DemoUser',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com',
    profileImageUrl: 'https://github.com/github.png',
    avatar: 'https://github.com/github.png'
  };
}

async function createServerWithDB(serverData: any, userData: any) {
  const db = initDatabase();
  
  if (db) {
    try {
      console.log('Attempting to create server in database...');
      
      // Create user first
      await db.query(`
        INSERT INTO users (id, username, "firstName", "lastName", "profileImageUrl", email, status, theme, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET 
          username = EXCLUDED.username,
          "profileImageUrl" = EXCLUDED."profileImageUrl",
          "updatedAt" = NOW()
      `, [userData.id, userData.username, userData.firstName, userData.lastName, userData.profileImageUrl, userData.email, '🟢 Online', 'light']);

      // Create server
      const result = await db.query(`
        INSERT INTO servers (name, description, category, "isPublic", "ownerId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [serverData.name, serverData.description, serverData.category, serverData.isPublic, userData.id]);

      const server = result.rows[0];
      console.log('Server created successfully in database:', server.id);
      
      // Create default channels
      await db.query(`
        INSERT INTO channels (name, type, "serverId", "createdAt", "updatedAt")
        VALUES 
          ('geral', 'text', $1, NOW(), NOW()),
          ('Sala de Voz', 'voice', $1, NOW(), NOW())
      `, [server.id]);
      
      return {
        id: server.id,
        name: server.name,
        description: server.description,
        category: server.category,
        isPublic: server.isPublic,
        ownerId: server.ownerId,
        memberCount: 1,
        createdAt: server.createdAt,
        updatedAt: server.updatedAt,
        owner: userData
      };
    } catch (error) {
      console.error('Database error details:', error);
      console.log('Falling back to memory storage...');
    }
  }

  // Fallback to memory storage
  const serverId = memoryStorage.serverIdCounter++;
  const newServer = {
    id: serverId,
    name: serverData.name,
    description: serverData.description,
    category: serverData.category,
    isPublic: serverData.isPublic,
    ownerId: userData.id,
    memberCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner: userData
  };
  
  memoryStorage.servers.set(serverId, newServer);
  memoryStorage.users.set(userData.id, userData);
  console.log('Server created in memory:', serverId);
  
  return newServer;
}

async function getServersWithDB(userId?: string) {
  const db = initDatabase();
  
  if (db) {
    try {
      let query = `
        SELECT s.*, u.username, u."firstName", u."lastName", u."profileImageUrl"
        FROM servers s
        LEFT JOIN users u ON s."ownerId" = u.id
      `;
      
      const params: any[] = [];
      if (userId) {
        query += ' WHERE s."ownerId" = $1';
        params.push(userId);
      } else {
        query += ' WHERE s."isPublic" = true';
      }
      
      query += ' ORDER BY s."createdAt" DESC';
      
      const result = await db.query(query, params);
      console.log(`Found ${result.rows.length} servers in database`);
      
      return result.rows.map(row => ({
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
          id: row.ownerId,
          username: row.username,
          firstName: row.firstName,
          lastName: row.lastName,
          profileImageUrl: row.profileImageUrl
        }
      }));
    } catch (error) {
      console.error('Database query error, using memory storage:', error);
    }
  }

  // Fallback to memory storage
  const servers = Array.from(memoryStorage.servers.values());
  if (userId) {
    return servers.filter(server => server.ownerId === userId);
  } else {
    return servers.filter(server => server.isPublic);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req;
  console.log(`${req.method} ${url}`);

  try {
    // Health check with detailed database info
    if (url === '/api/health') {
      const db = initDatabase();
      let dbStatus = 'disconnected';
      let dbError: string | null = null;
      let dbUrl: string | null = null;
      
      if (process.env.DATABASE_URL) {
        dbUrl = process.env.DATABASE_URL.substring(0, 50) + '...';
      }
      
      if (db) {
        try {
          const result = await db.query('SELECT version(), current_database()');
          dbStatus = 'connected';
          console.log('Database connection successful:', result.rows[0]);
        } catch (error) {
          dbStatus = 'error';
          dbError = error instanceof Error ? error.message : 'Unknown error';
          console.error('Database health check error:', error);
        }
      }
      
      return res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          error: dbError,
          hasEnvVar: !!process.env.DATABASE_URL,
          urlPrefix: dbUrl,
          poolExists: !!pool
        }
      });
    }

    // User auth
    if (url === '/api/auth/user') {
      const user = getAuthUser(req);
      return res.json(user);
    }

    // Get user servers
    if (url === '/api/servers' && req.method === 'GET') {
      const user = getAuthUser(req);
      const servers = await getServersWithDB(user.id);
      return res.json(servers);
    }

    // Get public servers
    if (url === '/api/servers/discover' && req.method === 'GET') {
      const servers = await getServersWithDB();
      return res.json(servers);
    }

    // Create server - THIS IS THE KEY FIX
    if (url === '/api/servers' && req.method === 'POST') {
      try {
        const user = getAuthUser(req);
        const serverData = req.body;
        
        console.log('Creating server with data:', serverData);
        
        if (!serverData.name || !serverData.category) {
          return res.status(400).json({ error: 'Name and category are required' });
        }

        const newServer = await createServerWithDB(serverData, user);
        console.log('Server created successfully:', newServer.id);
        
        return res.status(201).json(newServer);
      } catch (error) {
        console.error('Error creating server:', error);
        return res.status(500).json({ 
          error: 'Failed to create server',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // GitHub OAuth login
    if (url === '/api/auth/github' && req.method === 'GET') {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.log('GitHub OAuth credentials not found, using demo mode');
        const demoUser = {
          id: 'demo-user-' + Date.now(),
          username: 'DemoUser',
          firstName: 'Demo',
          lastName: 'User',
          profileImageUrl: 'https://github.com/github.png',
          email: 'demo@example.com'
        };
        
        const authToken = Buffer.from(JSON.stringify(demoUser)).toString('base64');
        res.setHeader('Set-Cookie', `auth-token=${authToken}; HttpOnly=false; Secure=false; Max-Age=${24 * 60 * 60}; Path=/`);
        return res.redirect(302, '/');
      }
      
      // Real GitHub OAuth flow
      const baseUrl = req.headers.host?.includes('vercel.app') ? `https://${req.headers.host}` : `http://${req.headers.host}`;
      const redirectUri = `${baseUrl}/api/auth/github/callback`;
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
      
      console.log('Redirecting to GitHub OAuth:', githubAuthUrl);
      return res.redirect(302, githubAuthUrl);
    }

    // GitHub OAuth callback
    if (url?.startsWith('/api/auth/github/callback') && req.method === 'GET') {
      const code = req.query?.code;
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      
      if (!code || !clientId || !clientSecret) {
        console.error('Missing OAuth parameters:', { code: !!code, clientId: !!clientId, clientSecret: !!clientSecret });
        return res.status(400).json({ error: 'Missing OAuth parameters' });
      }
      
      try {
        console.log('Exchanging code for access token...');
        
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
          }),
        });
        
        const tokenData = await tokenResponse.json();
        console.log('Token response received');
        
        if (!tokenData.access_token) {
          console.error('Failed to get access token:', tokenData);
          throw new Error('Failed to get access token');
        }
        
        // Get user info from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        
        const githubUser = await userResponse.json();
        console.log('GitHub user retrieved:', githubUser.login);
        
        const user = {
          id: `github-${githubUser.id}`,
          username: githubUser.login,
          firstName: githubUser.name?.split(' ')[0] || githubUser.login,
          lastName: githubUser.name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: githubUser.avatar_url,
          email: githubUser.email || null
        };
        
        const authToken = Buffer.from(JSON.stringify(user)).toString('base64');
        res.setHeader('Set-Cookie', `auth-token=${authToken}; HttpOnly=false; Secure=false; Max-Age=${24 * 60 * 60}; Path=/`);
        
        console.log('User authenticated successfully:', user.username);
        return res.redirect(302, '/');
      } catch (error) {
        console.error('GitHub OAuth error:', error);
        return res.status(500).json({ error: 'OAuth authentication failed' });
      }
    }

    // Legacy login route for compatibility
    if (url === '/api/login') {
      return res.redirect(302, '/api/auth/github');
    }

    // Logout route
    if (url === '/api/logout') {
      res.setHeader('Set-Cookie', 'auth-token=; HttpOnly=false; Secure=false; Max-Age=0; Path=/');
      
      if (req.method === 'POST') {
        return res.status(200).json({ message: 'Logged out successfully' });
      } else {
        return res.redirect(302, '/');
      }
    }

    // Server channels route
    if (url?.match(/^\/api\/servers\/\d+\/channels$/) && req.method === 'GET') {
      const serverId = parseInt(url.split('/')[3]);
      const user = getAuthUser(req);
      
      // Return basic channels for now
      const channels = [
        { id: 1, name: 'geral', type: 'text', serverId },
        { id: 2, name: 'Sala de Voz', type: 'voice', serverId }
      ];
      
      return res.json(channels);
    }

    // Channel messages route
    if (url?.match(/^\/api\/channels\/\d+\/messages$/) && req.method === 'GET') {
      const channelId = parseInt(url.split('/')[3]);
      const user = getAuthUser(req);
      
      // Return empty messages array for now
      return res.json([]);
    }

    // Send message route
    if (url?.match(/^\/api\/channels\/\d+\/messages$/) && req.method === 'POST') {
      const channelId = parseInt(url.split('/')[3]);
      const user = getAuthUser(req);
      const messageData = req.body;
      
      const message = {
        id: Date.now(),
        content: messageData.content,
        authorId: user.id,
        channelId: channelId,
        createdAt: new Date().toISOString(),
        author: user
      };
      
      return res.status(201).json(message);
    }

    // Join server route
    if (url?.match(/^\/api\/servers\/\d+\/join$/) && req.method === 'POST') {
      const serverId = parseInt(url.split('/')[3]);
      const user = getAuthUser(req);
      
      return res.json({ success: true, message: 'Joined server successfully' });
    }

    // Server members route
    if (url?.match(/^\/api\/servers\/\d+\/members$/) && req.method === 'GET') {
      const serverId = parseInt(url.split('/')[3]);
      const user = getAuthUser(req);
      
      // Return current user as member
      return res.json([user]);
    }

    // Default fallback
    return res.status(404).json({ error: 'Route not found', url, method: req.method });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}