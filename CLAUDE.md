# Claude Code Instructions

## Project Setup

This is a full-stack e-commerce application for ethnic wear (Vibes in Threads) with:
- **Backend**: Node.js, Express, TypeScript, Prisma ORM with PostgreSQL
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, React

## Development Commands

### Backend
- Start development server: `npm run fresh` (recommended - includes database setup)
- Alternative development: `npm run dev`
- Database setup: `npm run db:reset` (drops, creates, migrates, and seeds)
- Seed database: `npm run db:seed`

### Frontend
- Start development server: `npm run dev`
- Build production: `npm run build`

## Key Features

### Authentication System
- JWT-based authentication with refresh tokens
- Admin login endpoint: `POST /api/v1/auth/admin/login`
- Regular login endpoint: `POST /api/v1/auth/login`
- Default admin credentials:
  - Email: `admin@vibesinthreads.com`
  - Password: `admin`

### API Endpoints
- Base URL: `http://localhost:5000/api/v1`
- Documentation: `http://localhost:5000/api-docs`
- Health check: `http://localhost:5000/health`

### Frontend Routes
- Main app: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`
- Admin dashboard: `http://localhost:3000/admin`

## Important Notes

- Always run `npm run fresh` for the backend to ensure database is properly set up
- Admin users require `role: 'admin'` in database
- Frontend admin login integrates with backend admin authentication endpoint
- Both servers need to be running for full functionality