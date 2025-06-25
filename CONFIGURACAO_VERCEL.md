# Configurações para o Dashboard do Vercel

## 📋 Campos Obrigatórios no Vercel

### 1. Build Command (Comando de Construção)
```
npm run build
```

### 2. Output Directory (Diretório de Saída)
```
dist/public
```

### 3. Install Command (Comando de Instalação)
```
npm install
```

### 4. Root Directory (Diretório Raiz)
```
./
```
(deixe vazio ou use "./" - é a pasta raiz do projeto)

## 🔐 Variáveis de Ambiente Necessárias

No dashboard do Vercel, vá em **Settings > Environment Variables** e adicione:

### Variável 1: DATABASE_URL
- **Nome**: `DATABASE_URL`
- **Valor**: Sua string de conexão PostgreSQL
- **Exemplo**: `postgresql://usuario:senha@host:5432/database`

### Variável 2: SESSION_SECRET
- **Nome**: `SESSION_SECRET`
- **Valor**: String aleatória segura (32+ caracteres)
- **Gerar com**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Variável 3: NODE_ENV (Opcional)
- **Nome**: `NODE_ENV`
- **Valor**: `production`

## 🗂️ Framework Preset
Selecione: **Other** ou **Vite**

## ⚙️ Resumo das Configurações

| Campo | Valor |
|-------|-------|
| Build Command | `npm run build` |
| Output Directory | `dist/public` |
| Install Command | `npm install` |
| Root Directory | `./` |
| Framework Preset | Other/Vite |

## 🔍 Onde Encontrar no Dashboard

1. Acesse vercel.com e faça login
2. Importe seu projeto do GitHub/GitLab
3. Na tela de configuração:
   - **Build and Output Settings** → Configure os comandos acima
   - **Environment Variables** → Adicione DATABASE_URL e SESSION_SECRET
4. Clique em "Deploy"

## ✅ Checklist Pré-Deploy

- [ ] Banco PostgreSQL criado (Neon, Supabase ou Railway)
- [ ] DATABASE_URL copiada
- [ ] SESSION_SECRET gerada
- [ ] Comandos configurados no Vercel
- [ ] Projeto conectado ao Git (recomendado)

Pronto para deploy!