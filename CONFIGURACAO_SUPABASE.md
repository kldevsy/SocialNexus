# Configuração Supabase Database

## RESOLVIDO:
Projeto convertido do Neon para Supabase com driver PostgreSQL correto.

## Problema identificado:
Estava usando driver Neon, agora usando driver PostgreSQL padrão para Supabase.

## Configuração correta no Vercel:

### 1. Obter URL completa do Supabase
1. Acesse seu projeto Supabase: https://supabase.com/dashboard/project/ckdtoebxwuxkjeymwvjy
2. Vá em **Settings → Database → Connection pooling**
3. Copie a **Connection string** do **Transaction pooler** que tem este formato:
   ```
   postgresql://postgres.ckdtoebxwuxkjeymwvjy:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```

### 2. Substituir [YOUR-PASSWORD]
- Substitua `[YOUR-PASSWORD]` pela senha do banco que você definiu ao criar o projeto

### 3. Configurar no Vercel
- Dashboard Vercel → Settings → Environment Variables
- Atualizar `DATABASE_URL` com a string completa

### 4. Exemplo correto:
```
DATABASE_URL=postgresql://postgres.ckdtoebxwuxkjeymwvjy:SUA_SENHA_AQUI@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

Após configurar, o banco funcionará automaticamente!