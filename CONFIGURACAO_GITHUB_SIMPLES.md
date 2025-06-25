# Configuração GitHub OAuth - Passo a Passo

## O que acontece agora:
Quando você clica em "Login", aparece uma página explicando como configurar.

## Para ativar login de verdade:

### 1. Criar GitHub OAuth App
- Acesse: https://github.com/settings/applications/new
- Preencha:
  - **Application name**: CommunityHub
  - **Homepage URL**: `https://seu-projeto.vercel.app`
  - **Authorization callback URL**: `https://seu-projeto.vercel.app/api/auth/github/callback`

### 2. Pegar as credenciais
- Copie o **Client ID**
- Copie o **Client Secret**

### 3. Configurar no Vercel
- Dashboard Vercel > Settings > Environment Variables
- Adicionar:
  ```
  GITHUB_CLIENT_ID=cole_aqui_o_client_id
  GITHUB_CLIENT_SECRET=cole_aqui_o_client_secret
  ```

### 4. Aguardar redeploy
- Vercel faz redeploy automático
- Login funciona automaticamente

## Resultado:
- ✅ Site funcionando perfeitamente
- ✅ Interface carregando
- ⏳ Login aguardando configuração GitHub
- 🚀 Deploy no Vercel funcionando

Quer que eu te ajude com algum desses passos?