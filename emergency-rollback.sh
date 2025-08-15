#!/bin/bash
# emergency-rollback.sh - Emergency rollback script for Vibes in Threads
# Usage: ./emergency-rollback.sh [backup-file] [version]

set -e

BACKUP_FILE=$1
ROLLBACK_VERSION=${2:-"v1.0.0"}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./emergency-rollback.sh prod.db.backup.20250815-140000 [version]"
    echo ""
    echo "Available backups:"
    ls -la backend/prisma/prod.db.backup.* 2>/dev/null || echo "No backups found in backend/prisma/"
    ls -la backend/prisma/prisma/prod.db.backup.* 2>/dev/null || echo "No backups found in backend/prisma/prisma/"
    exit 1
fi

echo "🚨 Emergency rollback in progress..."
echo "📁 Using backup: $BACKUP_FILE"
echo "🏷️ Rolling back to version: $ROLLBACK_VERSION"

# Stop services to prevent data corruption
echo "⏹️ Stopping services..."
pm2 stop all

# Restore database
echo "🗄️ Restoring database..."
if [ -f "backend/prisma/$BACKUP_FILE" ]; then
    cp "backend/prisma/$BACKUP_FILE" backend/prisma/prod.db
    echo "✅ Database restored from backend/prisma/$BACKUP_FILE"
elif [ -f "backend/prisma/prisma/$BACKUP_FILE" ]; then
    cp "backend/prisma/prisma/$BACKUP_FILE" backend/prisma/prisma/prod.db
    echo "✅ Database restored from backend/prisma/prisma/$BACKUP_FILE"
else
    echo "❌ Backup file not found: $BACKUP_FILE"
    echo "Checking both locations:"
    ls -la backend/prisma/ | grep -E "\.db" || echo "No .db files in backend/prisma/"
    ls -la backend/prisma/prisma/ | grep -E "\.db" || echo "No .db files in backend/prisma/prisma/"
    exit 1
fi

# Rollback code version
echo "📝 Rolling back code to $ROLLBACK_VERSION..."
git checkout "$ROLLBACK_VERSION"

# Rebuild applications with rollback version
echo "🔨 Rebuilding backend..."
cd backend
npm run build

echo "🔨 Rebuilding frontend..."
cd ../frontend
NEXT_PUBLIC_API_URL='https://vibesinthreads.store/api/v1' npm run build
cd ..

# Restart services
echo "🔄 Restarting services..."
pm2 start all

# Verify rollback
echo "🏥 Verifying rollback..."
sleep 10

if curl -f https://vibesinthreads.store/health > /dev/null 2>&1; then
    echo "✅ Rollback completed successfully!"
    echo "🌐 Application: https://vibesinthreads.store"
    echo "📋 PM2 Status:"
    pm2 status
else
    echo "❌ Rollback verification failed!"
    echo "📋 PM2 Status:"
    pm2 status
    echo "📋 Recent logs:"
    pm2 logs --lines 20
    echo "🆘 Manual intervention required!"
    exit 1
fi

echo "🎯 Rollback completed. Monitor the application for stability."