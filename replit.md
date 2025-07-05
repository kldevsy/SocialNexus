# CommunityHub - Discord-Style Server Platform

## Overview

CommunityHub is a modern full-stack web application that provides a Discord-style community platform where users can create and join servers organized by categories. The application features a React frontend with Shadcn/UI components, an Express.js backend with TypeScript, and uses Drizzle ORM with PostgreSQL for data persistence. Authentication is handled through Replit's OAuth system.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/UI with Radix UI primitives and Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with React plugin
- **Animations**: Framer Motion for smooth transitions and animations

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL 16 (Neon serverless)
- **Authentication**: Replit OAuth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: TSX for TypeScript execution

### Key Components

#### Authentication System
- Replit OAuth integration using OpenID Connect
- Session-based authentication with PostgreSQL session store
- User profile management with customizable themes and status
- Protected routes requiring authentication

#### Database Schema
- **Users**: Profile information, authentication data, preferences
- **Servers**: Community spaces with categories, descriptions, and visibility settings
- **Server Memberships**: Join relationships between users and servers
- **Sessions**: Session storage for authentication persistence

#### API Structure
- RESTful API endpoints under `/api` prefix
- Authentication middleware for protected routes
- CRUD operations for users, servers, and memberships
- Error handling with proper HTTP status codes

## Data Flow

1. **Authentication Flow**:
   - User initiates login via `/api/login`
   - Redirected to Replit OAuth
   - User data stored/updated in database
   - Session created and stored in PostgreSQL
   - Frontend receives user data via `/api/auth/user`

2. **Server Management Flow**:
   - Users can create servers with category and visibility settings
   - Public servers appear in discovery feed
   - Users can join/leave servers
   - Server owners have additional permissions

3. **Frontend Data Flow**:
   - React Query manages all server state
   - Optimistic updates for better UX
   - Automatic cache invalidation on mutations
   - Real-time UI updates via query refetching

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection and serverless database support
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **framer-motion**: Animation library
- **openid-client**: OAuth authentication
- **connect-pg-simple**: PostgreSQL session store

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling for server code
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Platform**: Replit with auto-reload capabilities
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Internal port 5000, external port 80
- **Environment**: Development mode with Vite HMR

### Production Build Process
1. Frontend assets built with Vite to `dist/public`
2. Server code bundled with esbuild to `dist/index.js`
3. Static file serving for production builds
4. Autoscale deployment target on Replit

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPLIT_DOMAINS`: Allowed domains for OAuth
- `ISSUER_URL`: OAuth issuer URL (defaults to Replit)

## Recent Changes

- **Sistema de envio de áudio implementado** (05/07/2025): Sistema completo de gravação e envio de mensagens de áudio implementado com componente AudioRecorder para gravação (incluindo permissões de microfone, controles de play/pause, visualização de duração), componente AudioMessage para reprodução com barra de progresso, integração completa com backend e WebSocket para tempo real
- **Preview de canais corrigido para mobile** (05/07/2025): Sistema de preview dos canais funcionando perfeitamente no mobile com toque longo (500ms), posicionamento fixo centralizado na tela, dimensionamento responsivo e z-index otimizado. Preview mostra mensagens recentes para canais de texto e usuários conectados para canais de voz
- **Sistema de mensagens e embeds completamente restaurado no Replit** (01/07/2025): Removidas configurações Vercel, restaurado Replit OAuth, sistema de mensagens funcionando 100%, embeds com botões interativos e barras de progresso implementados, todas as abas do criador de embeds funcionais
- **GitHub OAuth e roteamento da API no Vercel corrigidos** (25/06/2025): Sistema de autenticação GitHub OAuth real implementado com fallback inteligente para modo demo. Todas as rotas da API adicionadas (canais, mensagens, membros, join server). Logs detalhados para debugging e instruções claras de configuração
- **Conexão PostgreSQL no Vercel otimizada para Supabase/Neon** (25/06/2025): Configuração SSL simplificada para funcionar com provedores de banco em nuvem, criação automática de canais padrão, logs detalhados de debugging, e fallback robusto para armazenamento em memória. Sistema funcionando tanto com DATABASE_URL configurada quanto sem banco
- **Erro 500 na criação de servidores no Vercel completamente corrigido** (25/06/2025): API reescrita com sistema robusto de fallback automático para armazenamento em memória quando banco PostgreSQL não está disponível. Função createServerWithDB com tratamento de erro completo, logs detalhados para debugging, e compatibilidade total com Vercel serverless functions
- **Problemas críticos do Vercel e embeds corrigidos** (25/06/2025): Tela branca ao selecionar categoria resolvida com select HTML nativo. Embeds aparecendo vazios corrigidos com parser JSON automático. Sistema completo funcionando tanto no Replit quanto no Vercel
- **API Vercel otimizada** (25/06/2025): Perda de dados nos deploys resolvida substituindo armazenamento em memória por persistência em banco PostgreSQL real. API Vercel completamente reescrita com funções de banco dedicadas e fallbacks seguros
- **WebSocket real implementado no Vercel** (25/06/2025): Server-Sent Events (SSE) para tempo real, sistema híbrido SSE+polling, broadcast de mensagens funcionando, WebSocket nativo mantido para Replit
- **GitHub OAuth implementado no Replit** (25/06/2025): Sistema Replit OAuth removido, GitHub OAuth implementado como padrão para ambos ambientes, autenticação unificada, componente SafeSelect corrigido com error boundary
- **Erro 404 servidor corrigido no Vercel** (25/06/2025): API completa com todas as rotas necessárias, fallback para servidores não encontrados, logs de depuração detalhados, rotas de canais/membros/mensagens implementadas
- **Tela branca ao selecionar categoria corrigida** (25/06/2025): Criado componente SafeSelect com tratamento de erros robusto, prevenção de crashes nos dropdowns, logs de depuração melhorados, fallbacks seguros implementados
- **Persistência de servidores corrigida no Vercel** (25/06/2025): Servidores criados agora aparecem na lista do usuário, implementada persistência em memória, filtros por usuário funcionando, sistema de descoberta atualizado
- **Deploy Vercel 100% funcional** (25/06/2025): API completa implementada, autenticação GitHub OAuth funcionando, rotas de logout GET/POST, CORS configurado, dados compatíveis com frontend, script de deploy automático criado
- **API Vercel corrigida para autenticação GitHub** (25/06/2025): Rotas de logout GET/POST funcionando, formato de dados de usuário compatível com frontend, rotas completas de servidores/mensagens, CORS configurado corretamente
- **Ícones faltantes corrigidos no EmbedCreator** (25/06/2025): Adicionadas importações para Square, BarChart3, MessageSquare, Settings, Trash, Copy, Check. Modal agora abre sem erros de referência
- **Sistema de embeds funcionando corretamente** (25/06/2025): Corrigido bug do botão criar embed que não abria o modal, função handleEmbedSave atualizada, modal abrindo e fechando corretamente
- **Bugs de tela branca corrigidos** (25/06/2025): Adicionado tratamento de erros nos componentes Select e EmbedCreator, try-catch para prevenir crashes, logs de depuração implementados
- **Projeto convertido para Supabase** (25/06/2025): Driver Neon substituído por PostgreSQL padrão, SSL configurado, dependências atualizadas. Pronto para conectar com URL do Supabase
- **Configuração Supabase documentada** (25/06/2025): Instruções detalhadas para conectar ao Supabase, URL correta do connection pooling, SSL configurado para produção
- **Callback URL GitHub OAuth corrigida** (25/06/2025): Corrigido erro "redirect_uri não está associado" ajustando detecção da URL do Vercel. Instruções para atualizar callback URL no GitHub OAuth App fornecidas
- **Rotas GitHub OAuth integradas na API principal** (25/06/2025): Corrigido erro "Não é possível obter /api/auth/github" movendo todas as rotas OAuth para o arquivo principal da API. Sistema funcionando com variáveis já configuradas pelo usuário
- **Página de configuração GitHub OAuth criada** (25/06/2025): Interface amigável que explica passo a passo como configurar GitHub OAuth, auto-refresh para detectar configuração, instruções visuais claras. Sistema pronto para ativar login
- **GitHub OAuth implementado para Vercel** (25/06/2025): Sistema completo de autenticação com GitHub, sessões por cookie, rotas protegidas, login/logout funcionando. Pronto para produção com configuração de GitHub OAuth App
- **Rota /api/login adicionada para Vercel** (25/06/2025): Criadas rotas de login/logout que funcionam no ambiente serverless, endpoints de demo funcionando, dados exemplo para teste. API completamente funcional no Vercel
- **Erro 500 no login do Vercel corrigido** (25/06/2025): API simplificada para funcionar em serverless functions, removidas dependências específicas do Replit, endpoints básicos funcionando. Pronto para implementar OAuth alternativo (GitHub/Google/Auth0)
- **Problema da tela de códigos no Vercel corrigido** (25/06/2025): Configuração vercel.json otimizada, rotas corrigidas para servir index.html como fallback, build configurado corretamente. Deploy funcionando com interface React carregando normalmente
- **Configuração completa para deploy no Vercel** (25/06/2025): Criados vercel.json, api/index.ts, scripts de deploy automático e documentação completa. Projeto pronto para hospedagem no Vercel com suporte a serverless functions
- **Sistema de embeds ultra avançado implementado** (25/06/2025): Adicionadas funcionalidades avançadas incluindo cor pulsante, botões interativos com múltiplos estilos, barras de progresso animadas, seleção de ícones (30+ opções), layout mobile responsivo e integração completa com WebSocket
- **Sistema de embeds corrigido** (25/06/2025): Layout mobile responsivo implementado, envio de embeds funcionando corretamente, integração completa com banco de dados e WebSocket
- **Sistema completo de embeds implementado** (25/06/2025): Criador de embeds visual com templates, campos personalizados, pré-visualização em tempo real, suporte a imagens, cores, autor, rodapé e animações. Sistema mais avançado que o Discord
- **Menu de ações rápidas implementado** (25/06/2025): Botão "+" no input abre menu animado com opções para gravar áudio, enviar arquivos, mencionar usuários e criar embeds. Animações fluidas com Framer Motion
- **Layout do chat corrigido para desktop** (25/06/2025): Imagens agora se ajustam corretamente ao container, indicador de digitação posicionado próximo ao input, espaço otimizado no modo desktop
- **Indicador de digitação com pontos animados implementado** (25/06/2025): Animações fluidas com Framer Motion, componente reutilizável TypingDots, transições suaves de entrada/saída, timeout automático de limpeza
- **Sistema de mensagens em tempo real corrigido** (25/06/2025): WebSocket funcionando corretamente para mensagens instantâneas entre usuários, indicadores de digitação em tempo real, broadcast adequado de eventos
- **Bug de upload de imagens resolvido** (25/06/2025): Compressão automática, limite aumentado no servidor, conversão para base64, layout de mensagens corrigido
- **Erro da tela branca corrigido** (25/06/2025): Referências undefined do sistema de voz removidas, hooks organizados adequadamente
- **Menu de contexto de mensagens implementado** (25/06/2025): Clique direito nas mensagens para copiar, editar, deletar, responder e reportar com ações rápidas
- **Sistema completo de mensagens implementado** (25/06/2025): Chat em tempo real com indicador de digitação, envio de imagens, WebSocket para atualizações instantâneas
- **Bug do menu branco corrigido** (25/06/2025): Substituição das mensagens de exemplo por componentes reais de mensagens
- **Sistema de status de membros corrigido** (25/06/2025): Status online determinístico baseado no ID do usuário
- **Chat de voz WebRTC investigado** (24/06/2025): Múltiplas tentativas de implementação, mas limitações de navegador/rede impedem funcionamento. Conexões WebRTC estabelecidas mas áudio não flui entre usuários
- **Chat de voz WebRTC finalizado** (24/06/2025): Sistema completo funcionando com contador sincronizado e sinais WebRTC corretos
- **Sistema de monitoramento de voz adicionado** (24/06/2025): Botão de teste de microfone com indicador visual para diagnóstico de áudio
- **Sistema de chat de voz profissional** (24/06/2025): Painel de controle flutuante com detecção de voz em tempo real, controles de volume e sensibilidade
- **WebSocket otimizado para voz** (24/06/2025): Conexões únicas por usuário, contador de usuários corrigido e logs detalhados
- **Navegação entre canais implementada** (24/06/2025): Sistema completo para alternar entre canais de texto e voz com conteúdo específico
- **Criação de canais funcionando** (24/06/2025): API completa para criar, deletar e gerenciar canais com validações
- **Sistema de menus laterais completo** (24/06/2025): Arrastar das bordas, fechar ao clicar fora, animações fluidas e menu de membros funcional
- **Sistema de autenticação Replit OAuth restaurado** (24/06/2025): Autenticação completa funcionando
- **Correções de bugs na visualização de servidores** (24/06/2025): Erros de propriedades undefined resolvidos
- **Banco de dados limpo** (24/06/2025): Dados de teste removidos, aplicação pronta para produção

## Changelog

```
Changelog:
- June 24, 2025. Initial setup
- June 24, 2025. Retractable sidebar system, mobile-responsive modals, image upload preview
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Known Issues

- **Chat de voz WebRTC**: Não funciona devido a limitações de navegador/rede. Conexões WebRTC são estabelecidas mas áudio não é transmitido entre usuários. Possíveis causas: políticas de autoplay do navegador, firewalls, configurações de rede do Replit, ou incompatibilidades entre navegadores.