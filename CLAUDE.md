# Claude Code Instructions

## Project Setup

This is a full-stack e-commerce application for ethnic wear (Vibes in Threads) with:
- **Backend**: Node.js, Express, TypeScript, Prisma ORM with PostgreSQL
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, React

## Development Commands

### Backend
- Start development server: `npm run dev` (includes full database setup)

#### Database Commands

**🔒 Data-Safe Commands (No Data Loss):**
- **Essential seeding**: `npm run db:seed` (admin user only - production safe)
- **Development seeding**: `npm run db:seed-dev` (categories, products - dev/test only, idempotent)

**⚠️ Destructive Commands (Will Delete All Data):**
- **Database reset**: `npm run db:reset` (drops entire database, recreates schema)
- **Production-safe setup**: `npm run db:setup` (reset + essential seeding only)
- **Development setup**: `npm run db:setup-dev` (reset + essential + test data)

### Frontend
- Start development server: `npm run dev` (includes port cleanup and cache clearing)
- Build production: `npm run build`

#### Frontend Commands
- **Port cleanup**: `npm run kill` (clears port 3000)
- **Cache cleanup**: `npm run clean` (clears .next cache)

## Key Features

### Authentication System
- JWT-based authentication with refresh tokens
- Admin login endpoint: `POST /api/v1/auth/admin/login`
- Regular login endpoint: `POST /api/v1/auth/login`
- Default admin credentials:
  - Email: `admin@vibesinthreads.store`
  - Password: `VibesAdmin@2025!Store`

### API Endpoints
- Base URL: `http://localhost:5000/api/v1`
- Documentation: `http://localhost:5000/api-docs`
- Health check: `http://localhost:5000/health`

### Frontend Routes
- Main app: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`
- Admin dashboard: `http://localhost:3000/admin`

## Important Notes

- Always run `npm run dev` for the backend to ensure database is properly set up
- **Seeding Strategy**: 
  - `npm run db:seed` - Only creates admin user (production-safe, idempotent)
  - `npm run db:seed-dev` - Adds test data (categories, products) - development only, idempotent
  - Environment protection prevents test data seeding in production
  - All seeding scripts are now idempotent (safe to run multiple times)
- Admin users require `role: 'admin'` in database
- Frontend admin login integrates with backend admin authentication endpoint
- Both servers need to be running for full functionality