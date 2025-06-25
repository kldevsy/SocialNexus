# Corrigir Erro GitHub Callback

## Problema identificado:
GitHub mostra erro "redirect_uri não está associado" porque a URL não corresponde exatamente à configurada no GitHub OAuth App.

## Solução:

### 1. Verifique a URL exata do seu projeto
- Acesse seu projeto no Vercel
- Copie a URL completa (ex: `https://community-hub-xyz.vercel.app`)

### 2. Atualize o GitHub OAuth App
1. Vá para [GitHub Applications](https://github.com/settings/applications)
2. Clique no seu app CommunityHub
3. Em "Authorization callback URL", cole exatamente:
   ```
   https://SEU-PROJETO-EXATO.vercel.app/api/auth/github/callback
   ```
4. Salve as mudanças

### 3. Teste novamente
- O redeploy automático já corrigiu a API
- Agora o GitHub aceitará o callback

## URLs que devem coincidir:
- **GitHub OAuth App**: `https://seu-projeto.vercel.app/api/auth/github/callback`
- **Vercel**: Sua URL real do projeto

Depois de atualizar no GitHub, o login funcionará perfeitamente.