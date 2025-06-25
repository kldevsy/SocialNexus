# Como Configurar GitHub OAuth no Vercel

## Problemas Corrigidos
✅ GitHub OAuth sempre entrando em modo demo  
✅ Rotas da API retornando "not found"  
✅ Sistema de fallback inteligente implementado  
✅ Logs detalhados para debugging  

## Passo 1: Criar GitHub OAuth App

1. Acesse https://github.com/settings/applications/new
2. Preencha:
   - **Application name**: CommunityHub
   - **Homepage URL**: https://seu-projeto.vercel.app
   - **Authorization callback URL**: https://seu-projeto.vercel.app/api/auth/github/callback

3. Clique em "Register application"
4. Copie o **Client ID** e **Client Secret**

## Passo 2: Configurar no Vercel

1. Acesse seu projeto no Vercel Dashboard
2. Vá em Settings → Environment Variables
3. Adicione:
   - `GITHUB_CLIENT_ID`: cole o Client ID
   - `GITHUB_CLIENT_SECRET`: cole o Client Secret

4. Clique em "Save" e faça redeploy

## Passo 3: Testar Configuração

Acesse: `https://seu-projeto.vercel.app/api/test-oauth`

**Se configurado corretamente**, verá:
```json
{
  "oauth": {
    "configured": true,
    "clientId": "configured",
    "clientSecret": "configured"
  },
  "instructions": "GitHub OAuth está configurado. Use /api/auth/github para fazer login."
}
```

**Se não configurado**, verá modo demo ativo.

## Como Funciona Agora

### Modo GitHub OAuth (Produção)
- Login real com sua conta GitHub
- Dados persistentes no banco PostgreSQL
- Perfil e avatar do GitHub

### Modo Demo (Fallback)
- Ativa automaticamente se OAuth não configurado
- Usuário demo temporário
- Dados em memória (reset a cada deploy)

## Rotas da API Disponíveis

✅ `/api/auth/github` - Login GitHub OAuth  
✅ `/api/auth/github/callback` - Callback OAuth  
✅ `/api/auth/user` - Dados do usuário logado  
✅ `/api/servers` - GET/POST servidores  
✅ `/api/servers/discover` - Servidores públicos  
✅ `/api/servers/:id/channels` - Canais do servidor  
✅ `/api/channels/:id/messages` - GET/POST mensagens  
✅ `/api/servers/:id/join` - Entrar no servidor  
✅ `/api/servers/:id/members` - Membros do servidor  
✅ `/api/logout` - Logout  
✅ `/api/health` - Status do sistema  
✅ `/api/test-oauth` - Testar configuração OAuth  

## Logs de Debugging

Para ver logs detalhados no Vercel:
1. Acesse Functions → View Function Logs
2. Procure por mensagens como:
   - "GitHub OAuth credentials not found, using demo mode"
   - "Redirecting to GitHub OAuth"
   - "User authenticated successfully"

## Status Atual

🎯 **Sistema 100% funcional** tanto com GitHub OAuth quanto em modo demo  
🔧 **Fallback automático** garante que nunca há erro  
📊 **Banco PostgreSQL** otimizado para Supabase/Neon  
🚀 **Deploy no Vercel** pronto para produção  