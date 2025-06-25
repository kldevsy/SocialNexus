#!/bin/bash

echo "🚀 Deploy CommunityHub no Vercel"
echo "================================"

# Verificar se o projeto tem as configurações necessárias
if [ ! -f "vercel.json" ]; then
    echo "❌ Arquivo vercel.json não encontrado!"
    exit 1
fi

if [ ! -f "api/index.ts" ]; then
    echo "❌ API serverless não encontrada!"
    exit 1
fi

echo "✅ Configurações encontradas"

# Build do projeto
echo "📦 Executando build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build falhou!"
    exit 1
fi

echo "✅ Build concluído"

# Deploy no Vercel
echo "🚀 Fazendo deploy no Vercel..."
npx vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deploy concluído com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure GITHUB_CLIENT_ID no Vercel"
    echo "2. Configure GITHUB_CLIENT_SECRET no Vercel"
    echo "3. Acesse sua aplicação e teste o login"
    echo ""
    echo "🔗 Documentação: DEPLOY_VERCEL_CORRIGIDO.md"
else
    echo "❌ Deploy falhou!"
    exit 1
fi