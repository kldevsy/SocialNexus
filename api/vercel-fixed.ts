// Vercel API corrigida para persistência e estabilidade
import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { Pool } from 'pg';

// Database connection singleton
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

// Database operations
async function getUserServers(userId: string) {
  const db = getPool();
  if (!db) return [];

  try {
    const result = await db.query(`
      SELECT s.*, 
             u.id as owner_id, u.username as owner_username, 
             u."firstName" as owner_first_name, u."lastName" as owner_last_name,
             u."profileImageUrl" as owner_profile_image
      FROM servers s
      LEFT JOIN users u ON s."ownerId" = u.id
      WHERE s."ownerId" = $1
      ORDER BY s."createdAt" DESC
    `, [userId]);
    
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
        id: row.owner_id,
        username: row.owner_username,
        firstName: row.owner_first_name,
        lastName: row.owner_last_name,
        profileImageUrl: row.owner_profile_image
      }
    }));
  } catch (error) {
    console.error('Erro ao buscar servidores do usuário:', error);
    return [];
  }
}

async function getPublicServers() {
  const db = getPool();
  if (!db) {
    // Fallback para dados estáticos se não houver banco
    return [
      {
        id: 1,
        name: 'Servidor Gaming',
        description: 'Comunidade para gamers',
        category: 'Gaming',
        isPublic: true,
        ownerId: 'system',
        memberCount: 150,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: { 
          id: 'system', 
          username: 'GameMaster',
          firstName: 'Game',
          lastName: 'Master',
          profileImageUrl: null
        }
      }
    ];
  }

  try {
    const result = await db.query(`
      SELECT s.*, 
             u.id as owner_id, u.username as owner_username, 
             u."firstName" as owner_first_name, u."lastName" as owner_last_name,
             u."profileImageUrl" as owner_profile_image
      FROM servers s
      LEFT JOIN users u ON s."ownerId" = u.id
      WHERE s."isPublic" = true
      ORDER BY s."createdAt" DESC
      LIMIT 20
    `);
    
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
        id: row.owner_id,
        username: row.owner_username,
        firstName: row.owner_first_name,
        lastName: row.owner_last_name,
        profileImageUrl: row.owner_profile_image
      }
    }));
  } catch (error) {
    console.error('Erro ao buscar servidores públicos:', error);
    return [];
  }
}

async function createServer(serverData: any, userData: any) {
  const db = getPool();
  if (!db) {
    throw new Error('Banco de dados não disponível');
  }

  try {
    // Garantir que o usuário existe
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

    // Criar o servidor
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
    console.error('Erro ao criar servidor:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = express();
    
    // Middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // CORS
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

    // Função auxiliar para autenticação
    function getAuthUser(req: any) {
      const authCookie = req.headers.cookie?.split(';').find((c: string) => c.trim().startsWith('auth-token='));
      if (!authCookie) return null;
      
      try {
        const tokenValue = authCookie.split('=')[1];
        return JSON.parse(Buffer.from(tokenValue, 'base64').toString());
      } catch {
        return null;
      }
    }

    // Auth routes
    app.get('/api/auth/user', (req, res) => {
      const userData = getAuthUser(req);
      if (!userData) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

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
    });

    // GitHub OAuth
    app.get('/api/auth/github', (req, res) => {
      const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
      
      if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return res.status(500).json({ 
          error: 'GitHub OAuth não configurado',
          message: 'Configure GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET nas variáveis de ambiente'
        });
      }

      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const redirectUri = `${protocol}://${host}/api/auth/github/callback`;
      const scope = 'user:email';
      const state = Math.random().toString(36).substring(7);
      
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
      
      res.redirect(authUrl);
    });

    app.get('/api/auth/github/callback', async (req, res) => {
      const { code } = req.query;
      const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;

      if (!code) {
        return res.status(400).json({ error: 'Código de autorização não encontrado' });
      }

      try {
        // Trocar código por token
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

        // Buscar dados do usuário
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/json',
          },
        });

        const userData = await userResponse.json();

        // Criar sessão
        const userSession = {
          id: userData.id.toString(),
          username: userData.login,
          email: userData.email,
          avatar: userData.avatar_url,
          provider: 'github'
        };

        // Definir cookie
        res.setHeader('Set-Cookie', [
          `auth-token=${Buffer.from(JSON.stringify(userSession)).toString('base64')}; HttpOnly; Path=/; Max-Age=604800; ${process.env.NODE_ENV === 'production' ? 'Secure; SameSite=Strict' : ''}`
        ]);

        res.redirect('/');
        
      } catch (error) {
        console.error('Erro no GitHub OAuth:', error);
        res.status(500).json({ error: 'Falha na autenticação' });
      }
    });

    // Logout
    app.get('/api/logout', (req, res) => {
      res.setHeader('Set-Cookie', ['auth-token=; HttpOnly; Path=/; Max-Age=0']);
      res.redirect('/');
    });

    app.post('/api/logout', (req, res) => {
      res.setHeader('Set-Cookie', ['auth-token=; HttpOnly; Path=/; Max-Age=0']);
      res.json({ message: 'Logout realizado com sucesso' });
    });

    // Server routes
    app.get('/api/servers', async (req, res) => {
      const userData = getAuthUser(req);
      if (!userData) {
        return res.status(401).json({ message: 'Autenticação obrigatória' });
      }

      try {
        const servers = await getUserServers(userData.id);
        res.json(servers);
      } catch (error) {
        console.error('Erro ao buscar servidores:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    });

    app.get('/api/servers/discover', async (req, res) => {
      const userData = getAuthUser(req);
      if (!userData) {
        return res.status(401).json({ message: 'Autenticação obrigatória' });
      }

      try {
        const servers = await getPublicServers();
        res.json(servers);
      } catch (error) {
        console.error('Erro ao buscar servidores públicos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    });

    app.post('/api/servers', async (req, res) => {
      const userData = getAuthUser(req);
      if (!userData) {
        return res.status(401).json({ message: 'Autenticação obrigatória para criar servidores' });
      }

      try {
        const { name, description, category, isPublic } = req.body;
        
        if (!name || !category) {
          return res.status(400).json({ message: 'Nome e categoria são obrigatórios' });
        }
        
        const serverData = {
          name: name.trim(),
          description: description?.trim() || '',
          category: category.trim(),
          isPublic: isPublic !== false
        };
        
        const newServer = await createServer(serverData, userData);
        res.status(201).json(newServer);
      } catch (error) {
        console.error('Erro ao criar servidor:', error);
        res.status(500).json({ message: 'Erro ao criar servidor' });
      }
    });

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Handle the request using Express
    app(req, res);

  } catch (error) {
    console.error('Erro no handler da API:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}