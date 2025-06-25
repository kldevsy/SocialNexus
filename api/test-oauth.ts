import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req;
  console.log(`Testing OAuth - ${req.method} ${url}`);

  // Check environment variables
  const hasClientId = !!process.env.GITHUB_CLIENT_ID;
  const hasClientSecret = !!process.env.GITHUB_CLIENT_SECRET;
  
  // Test GitHub OAuth status
  if (url === '/api/test-oauth') {
    return res.json({
      timestamp: new Date().toISOString(),
      environment: 'vercel',
      oauth: {
        configured: hasClientId && hasClientSecret,
        clientId: hasClientId ? 'configured' : 'missing',
        clientSecret: hasClientSecret ? 'configured' : 'missing',
        host: req.headers.host,
        protocol: req.headers.host?.includes('vercel.app') ? 'https' : 'http'
      },
      instructions: hasClientId && hasClientSecret 
        ? 'GitHub OAuth está configurado. Use /api/auth/github para fazer login.'
        : 'Configure GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET no Vercel para ativar o GitHub OAuth.'
    });
  }

  return res.status(404).json({ error: 'Use /api/test-oauth para testar' });
}