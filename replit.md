# Google Drive Watch2Gether Integration

## Overview

This is a web application that integrates Google Drive video folders with Watch2Gether for synchronized video watching. Users can paste a Google Drive folder URL containing video files, and the application creates a Watch2Gether room where they can watch videos together with others. The app fetches video metadata from Google Drive using the Google Drive API and manages playlist navigation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom plugins for Replit integration
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme configuration and CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (compiled with tsx for development, esbuild for production)
- **API Structure**: RESTful endpoints under `/api/*` prefix
- **Storage**: In-memory storage class (MemStorage) for application state

### Data Flow
1. User submits Google Drive folder URL
2. Backend extracts folder ID and fetches video files via Google Drive API
3. Videos are stored in memory with streaming URLs
4. Watch2Gether room is created/updated with current video
5. Frontend displays playlist and provides navigation controls

### Key Design Patterns
- **Shared Schema**: Types and validation schemas in `/shared` directory used by both frontend and backend
- **Typed API Routes**: API contracts defined with Zod schemas in `shared/routes.ts`
- **Component Library**: Comprehensive shadcn/ui components in `client/src/components/ui/`

## External Dependencies

### Third-Party APIs
- **Google Drive API**: Fetches video files from shared folders (requires `GOOGLE_API_KEY` environment variable)
- **Watch2Gether API**: Creates synchronized video watching rooms (requires `W2G_API_KEY` environment variable)

### Database
- **Drizzle ORM**: Configured for PostgreSQL with schema in `shared/schema.ts`
- **Current State**: Uses in-memory storage; database schema exists but database connection requires `DATABASE_URL` environment variable

### Required Environment Variables
- `GOOGLE_API_KEY` - Google Cloud API key with Drive API access
- `W2G_API_KEY` - Watch2Gether API key for room creation
- `DATABASE_URL` - PostgreSQL connection string (for future persistent storage)

### Key NPM Packages
- `axios` - HTTP client for external API calls
- `drizzle-orm` / `drizzle-zod` - Database ORM and Zod integration
- `@tanstack/react-query` - Data fetching and caching
- `zod` - Schema validation
- Radix UI primitives - Accessible UI components