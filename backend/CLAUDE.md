# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with nodemon (watches TypeScript files)
- `npm run build` - Compile TypeScript to JavaScript in `dist/` directory
- `npm start` - Run production server from compiled JavaScript

### Database Operations
- `npm run prisma:generate` - Generate Prisma client after schema changes
- `npm run prisma:push` - Push schema changes to database (for development)
- `npm run prisma:migrate` - Create and run database migrations
- `npm run prisma:studio` - Open Prisma Studio for database management
- `npm run seed` - Seed database with initial data

### Testing
- No test framework configured yet (`npm test` will exit with error)

## Architecture Overview

This is a Node.js/Express REST API backend for "Vibes in Threads" - an Indian ethnic fashion e-commerce platform.

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite (with PostgreSQL migration path prepared)
- **ORM**: Prisma
- **Authentication**: JWT with bcryptjs
- **Security**: Helmet, CORS

### Project Structure
```
src/
├── config/database.ts     # Prisma client configuration
├── controllers/           # Request handlers
├── middleware/           # Express middleware (error handling)
├── routes/              # API route definitions
├── services/            # Business logic layer
├── types/               # TypeScript type definitions
└── utils/               # Helper functions
```

### Data Models
The application focuses on Indian ethnic fashion with these key entities:
- **Products**: Support for Indian-specific attributes (fabric, occasion, designer, craft type, region)
- **Categories**: Hierarchical structure for organizing products
- **Users**: Customer accounts with fashion preferences
- **Orders**: Complete order management system
- **Product Variants**: Size, color, style variations
- **Addresses**: Indian address format support

### API Structure
- Base URL: `/api/v1`
- Health check: `/health`
- Current endpoints: `/products`, `/categories`
- Authentication: JWT-based (middleware ready)

### Database Configuration
- Uses SQLite by default for development
- Schema prepared for PostgreSQL migration
- Environment variable: `DATABASE_URL`
- Prisma handles all database operations

### Environment Variables
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode
- `DATABASE_URL` - Database connection string
- `CORS_ORIGIN` - CORS allowed origin (default: http://localhost:3000)

### Development Workflow
1. Run `npm run prisma:generate` after schema changes
2. Use `npm run prisma:push` for development database updates
3. Use `npm run dev` for development with hot reload
4. Build with `npm run build` before production deployment