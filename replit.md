# Wechsler Memory Scale Training Application

## Overview

This is a React-based cognitive training application that implements exercises based on the Wechsler Memory Scale (WMS). The application provides four different training modes for working memory assessment and improvement: Digit Span Forward/Backward and Spatial Span Forward/Backward. Users can practice memory exercises with progressive difficulty levels and track their performance statistics.

## System Architecture

The application follows a full-stack architecture with:

**Frontend**: React 18 with TypeScript, using Vite as the build tool
**Backend**: Express.js server with TypeScript
**Database**: PostgreSQL with Drizzle ORM
**UI Framework**: Tailwind CSS with shadcn/ui components
**State Management**: TanStack React Query for server state, local storage for client-side persistence
**Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **React Components**: Modular component structure with shadcn/ui design system
- **Game Logic**: Centralized game mechanics in `lib/game-logic.ts` handling sequence generation and validation
- **Storage Management**: Local storage abstraction for offline progress tracking
- **Responsive Design**: Mobile-first approach with Tailwind CSS utilities

### Backend Architecture
- **RESTful API**: Express.js server with structured route handling
- **Storage Layer**: Abstracted storage interface supporting both in-memory and database implementations
- **Middleware**: Request logging, error handling, and JSON parsing
- **Database Schema**: Drizzle ORM with PostgreSQL for scalable data persistence

### Game Modes
1. **Digit Span Forward**: Sequential number recall in original order
2. **Digit Span Backward**: Sequential number recall in reverse order  
3. **Spatial Span Forward**: Letter sequence recall in original order
4. **Spatial Span Backward**: Letter sequence recall in reverse order
5. **Operation Span Task**: Math problems with word memorization and recall
6. **Culture Fair Intelligence Test**: Visual puzzles including series completion, classification, matrices, and conditional reasoning

## Data Flow

1. **Game Session**: User selects mode → sequence generation → display phase → input phase → validation → scoring
2. **Progress Tracking**: Game results stored locally and optionally synced to backend
3. **Statistics**: Performance metrics calculated from historical game data
4. **State Management**: React Query handles server state caching and synchronization

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with hooks and concurrent features
- **Express.js**: Backend server framework
- **TypeScript**: Type safety across the entire application
- **Vite**: Fast development server and build tool

### Database & ORM
- **Drizzle ORM**: Type-safe database queries and migrations
- **@neondatabase/serverless**: PostgreSQL database connection
- **connect-pg-simple**: PostgreSQL session store

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible React components
- **Radix UI**: Unstyled, accessible UI primitives
- **Lucide React**: Icon library

### State Management & Data Fetching
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation for forms and API responses

## Deployment Strategy

The application is configured for deployment on Replit with:

- **Development**: `npm run dev` starts both frontend and backend in development mode
- **Build**: `npm run build` creates optimized production bundles
- **Production**: `npm start` serves the built application
- **Database**: Drizzle migrations with `npm run db:push`

Environment variables required:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development/production)

The build process creates:
- Client bundle in `dist/public/` directory
- Server bundle in `dist/` directory
- Static assets served by Express in production

## Changelog

```
Changelog:
- July 09, 2025. Enhanced Culture Fair Intelligence Test with logical patterns and helpful hints
- July 09, 2025. Added Culture Fair Intelligence Test with 5 visual puzzle types
- July 02, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```