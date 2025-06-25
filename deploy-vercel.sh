#!/bin/bash

echo "🚀 Configurando deploy para Vercel..."

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
fi

echo "✅ Gerando SESSION_SECRET..."
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "📝 Configuração necessária:"
echo ""
echo "1. DATABASE_URL - Você precisa de um banco PostgreSQL online:"
echo "   - Neon.tech (grátis): https://neon.tech"
echo "   - Supabase (grátis): https://supabase.com"
echo "   - Railway (grátis): https://railway.app"
echo ""
echo "2. SESSION_SECRET gerado:"
echo "   $SESSION_SECRET"
echo ""
echo "3. Execute o deploy:"
echo "   vercel"
echo ""
echo "4. Configure as variáveis no dashboard do Vercel:"
echo "   - DATABASE_URL=sua_url_do_banco"
echo "   - SESSION_SECRET=$SESSION_SECRET"
echo ""
echo "5. Após o primeiro deploy, execute as migrações:"
echo "   export DATABASE_URL='sua_url_do_banco'"
echo "   npm run db:push"
echo ""
echo "🎉 Pronto para deploy!"