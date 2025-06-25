# GitHub OAuth Setup para Vercel

## 1. Criar GitHub OAuth App

1. Vá para [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em "New OAuth App"
3. Preencha:
   - **Application name**: CommunityHub
   - **Homepage URL**: `https://seu-projeto.vercel.app`
   - **Authorization callback URL**: `https://seu-projeto.vercel.app/api/auth/github/callback`
4. Clique em "Register application"
5. Copie o **Client ID** e **Client Secret**

## 2. Configurar no Vercel

No dashboard do Vercel, vá em Settings > Environment Variables:

```
GITHUB_CLIENT_ID=seu_client_id_aqui
GITHUB_CLIENT_SECRET=seu_client_secret_aqui
```

## 3. Como funciona

- Usuário clica em "Login"
- Redirecionado para GitHub
- Autoriza o app
- Volta para seu site logado
- Sessão mantida por cookie

## 4. Testar

1. Redeploy no Vercel
2. Acesse seu site
3. Clique em Login
4. Será redirecionado para GitHub
5. Após autorizar, volta logado

## Status após configuração:
- Login com GitHub funcionando
- Sessões mantidas por cookie
- API protegida funcionando
- Logout funcionando