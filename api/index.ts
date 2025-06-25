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