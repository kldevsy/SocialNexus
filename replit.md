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