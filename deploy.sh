#!/bin/bash
# deploy.sh - Automated deployment script for Vibes in Threads
# Usage: ./deploy.sh v1.1.0

set -e  # Exit on any error

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: ./deploy.sh v1.1.0"
    exit 1
fi

echo "🚀 Deploying $VERSION to production..."

# Backup database
BACKUP_FILE="backend/prisma/prod.db.backup.$(date +%Y%m%d-%H%M%S)"
if [ -f "backend/prisma/prod.db" ]; then
    cp backend/prisma/prod.db "$BACKUP_FILE"
    echo "📦 Database backed up to $BACKUP_FILE"
else
    # Check for nested directory structure
    if [ -f "backend/prisma/prisma/prod.db" ]; then
        cp backend/prisma/prisma/prod.db "backend/prisma/prisma/prod.db.backup.$(date +%Y%m%d-%H%M%S)"
        echo "📦 Database backed up from nested location"
    else
        echo "⚠️ No existing database found - fresh deployment"
    fi
fi

# Deploy new version
echo "📥 Pulling latest changes..."
git pull origin main
git checkout "$VERSION"

# Generate secure JWT secrets for ecosystem config
echo "🔐 Generating secure JWT secrets..."
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Update ecosystem config with real secrets
sed -i "s/REPLACE_WITH_JWT_SECRET_DURING_DEPLOYMENT/$JWT_SECRET/g" ecosystem.config.js
sed -i "s/REPLACE_WITH_JWT_REFRESH_SECRET_DURING_DEPLOYMENT/$JWT_REFRESH_SECRET/g" ecosystem.config.js

# Install production dependencies including required dev dependencies for build
echo "📦 Installing backend dependencies..."
cd backend
npm ci --production
npm install --save-dev @types/jsonwebtoken @types/cors @types/morgan typescript ts-node @types/node

# Build backend
echo "🔨 Building backend..."
npm run build

# Database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate:deploy || echo "⚠️ Migration deploy failed, continuing..."

cd ../frontend

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm ci --production
npm install --save-dev typescript @types/node @types/react @types/react-dom

# Build frontend with production API URL
echo "🔨 Building frontend..."
NEXT_PUBLIC_API_URL='https://vibesinthreads.store/api/v1' npm run build

cd ..

# Restart services
echo "🔄 Restarting services..."
pm2 reload all || pm2 start ecosystem.config.js

# Health check
echo "🏥 Performing health check..."
sleep 15

if curl -f https://vibesinthreads.store/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "🌐 Application: https://vibesinthreads.store"
    echo "📚 API Docs: https://vibesinthreads.store/api-docs"
    echo "👩‍💼 Admin: https://vibesinthreads.store/admin/login"
    
    # Clean old backups (keep last 5)
    ls -t backend/prisma/prod.db.backup.* 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    ls -t backend/prisma/prisma/prod.db.backup.* 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
else
    echo "❌ Health check failed!"
    echo "📋 PM2 Status:"
    pm2 status
    echo "📋 Recent logs:"
    pm2 logs --lines 20
    echo "🚨 Consider rollback: git checkout v1.0.0 && pm2 reload all"
    exit 1
fi

echo "🎉 Deployment completed successfully!"