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

## Changelog

```
Changelog:
- June 24, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```