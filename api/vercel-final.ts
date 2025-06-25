import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Database connection with robust error handling
let pool: Pool | null = null;

function initDatabase() {
  if (!pool && process.env.DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      console.log('Database pool initialized');
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
      // Try database first
      await db.query(`
        INSERT INTO users (id, username, "firstName", "lastName", "profileImageUrl", email, status, theme)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET "updatedAt" = NOW()
      `, [userData.id, userData.username, userData.firstName, userData.lastName, userData.profileImageUrl, userData.email, '🟢 Online', 'light']);

      const result = await db.query(`
        INSERT INTO servers (name, description, category, "isPublic", "ownerId")
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [serverData.name, serverData.description, serverData.category, serverData.isPublic, userData.id]);

      const server = result.rows[0];
      console.log('Server created in database:', server.id);
      
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
      console.error('Database error, using memory storage:', error);
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
    // Health check
    if (url === '/api/health') {
      const db = initDatabase();
      let dbStatus = 'disconnected';
      
      if (db) {
        try {
          await db.query('SELECT 1');
          dbStatus = 'connected';
        } catch {
          dbStatus = 'error';
        }
      }
      
      return res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        hasEnvVar: !!process.env.DATABASE_URL
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

    // Default fallback
    return res.status(404).json({ error: 'Route not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}