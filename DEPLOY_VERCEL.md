# 🚀 Deploy no Vercel - Guia Completo

Seu projeto CommunityHub está pronto para ser hospedado no Vercel! Siga este guia passo a passo.

## 🎯 Método Rápido (Recomendado)

Execute o script automático que criei para você:

```bash
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

Este script vai:
- Instalar o Vercel CLI (se necessário)
- Gerar uma SESSION_SECRET segura
- Mostrar todas as instruções necessárias

## 📋 Passo a Passo Manual

### 1. Preparar o Ambiente

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login
```

## Passo 2: Configurar Banco de Dados

Você precisa de um banco PostgreSQL online. Recomendo:

### Opção A: Neon (Grátis)
1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a string de conexão (DATABASE_URL)

### Opção B: Supabase (Grátis)
1. Acesse [supabase.com](https://supabase.com)
2. Crie um projeto
3. Vá em Settings > Database
4. Copie a connection string

### Opção C: Railway (Grátis)
1. Acesse [railway.app](https://railway.app)
2. Crie um projeto PostgreSQL
3. Copie a DATABASE_URL

## Passo 3: Deploy no Vercel

1. **No terminal, dentro da pasta do projeto**:
```bash
vercel
```

2. **Configure as variáveis de ambiente no Vercel**:
   - Acesse o dashboard do Vercel
   - Vá no seu projeto > Settings > Environment Variables
   - Adicione estas variáveis:

```
DATABASE_URL=postgresql://seu_usuario:senha@host:porta/database
SESSION_SECRET=uma_string_secreta_aleatoria_bem_longa
VERCEL_URL=seu-app.vercel.app
```

3. **Para gerar uma SESSION_SECRET segura**, use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Passo 4: Configurar Domínio (Opcional)

1. No dashboard do Vercel, vá em Settings > Domains
2. Adicione seu domínio personalizado

## Passo 5: Executar Migrações do Banco

Após o primeiro deploy, você precisa configurar o banco:

1. **Instale as dependências localmente**:
```bash
npm install
```

2. **Configure a variável DATABASE_URL local**:
```bash
export DATABASE_URL="sua_string_de_conexao_aqui"
```

3. **Execute as migrações**:
```bash
npm run db:push
```

## Comandos Úteis

- **Deploy manual**: `vercel --prod`
- **Ver logs**: `vercel logs [url-do-deploy]`
- **Redeploy**: `vercel --prod --force`

## Solução de Problemas

### Erro de Autenticação
- O sistema usa Replit OAuth por padrão
- Para usar no Vercel, você pode:
  1. Implementar outro sistema de auth (Google, GitHub)
  2. Ou configurar as variáveis REPLIT_DOMAINS e ISSUER_URL

### Erro de Banco de Dados
- Verifique se a DATABASE_URL está correta
- Teste a conexão localmente primeiro
- Certifique-se que executou `npm run db:push`

### Erro de Build
- Verifique os logs com `vercel logs`
- Todos os arquivos TypeScript devem compilar sem erro

## Estrutura Final

Depois do deploy, você terá:
- Frontend React servido pelo Vercel
- API Express rodando como serverless functions
- Banco PostgreSQL hospedado externamente
- Deploy automático a cada push no GitHub (se conectar o repo)