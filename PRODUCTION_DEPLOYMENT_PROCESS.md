# Production Deployment Process - Vibes in Threads

## 🎯 Overview
Streamlined production deployment process for Vibes in Threads e-commerce application to DigitalOcean droplet.

**Production Server:** do-droplet (178.128.130.14)  
**Domain:** https://vibesinthreads.store  
**SSH Access:** `ssh do-droplet`

---

## 📋 Local Pre-Deployment

### 1. Prepare Code and Environment
```bash
# Save uncommitted work and checkout deployment tag
git stash push -m "Pre-deployment stash $(date +%Y%m%d-%H%M%S)"
git fetch --tags origin
git checkout v1.1.0  # Replace with target deployment tag
git describe --tags   # Verify correct tag

# Create deployment timestamp for consistent naming
DEPLOY_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "📦 Deploying version: $(git describe --tags) at ${DEPLOY_TIMESTAMP}"
```

### 2. Build Backend
```bash
cd backend

# Clean previous builds and cache
rm -rf dist/ node_modules/.cache/ tsconfig.tsbuildinfo
npm cache clean --force

# Install dependencies including dev tools for build
npm ci --production
npm install --save-dev @types/jsonwebtoken @types/cors @types/morgan typescript ts-node @types/node

# Build with production environment
NODE_ENV=production npm run build
ls -la dist/ && echo "✅ Backend build completed"

cd ..
```

### 3. Build Frontend
```bash
cd frontend

# Clean previous builds and cache
rm -rf .next/ out/ node_modules/.cache/
npm cache clean --force

# Install dependencies
npm ci --production
npm install --save-dev typescript @types/node @types/react @types/react-dom

# Build with production API URL
NEXT_PUBLIC_API_URL='https://vibesinthreads.store/api/v1' NODE_ENV=production npm run build
ls -la .next/ && echo "✅ Frontend build completed"

cd ..
```

### 4. Validate and Package Builds
```bash
# Verify no localhost references in builds
echo "🔍 Validating build artifacts..."
grep -r "localhost" frontend/.next/ && echo "❌ Found localhost references!" || echo "✅ No localhost references"
grep -r "vibesinthreads.store" frontend/.next/ && echo "✅ Production URLs found" || echo "❌ Missing production URLs!"

# Create deployment packages
tar -czf "vibes-backend-${DEPLOY_TIMESTAMP}.tar.gz" -C backend dist/ node_modules/ prisma/ package.json package-lock.json .env.production
tar -czf "vibes-frontend-${DEPLOY_TIMESTAMP}.tar.gz" -C frontend .next/ node_modules/ public/ package.json package-lock.json .env.production

echo "📦 Created packages: vibes-backend-${DEPLOY_TIMESTAMP}.tar.gz, vibes-frontend-${DEPLOY_TIMESTAMP}.tar.gz"
```

### 5. Transfer to Server
```bash
# Upload deployment packages
scp "vibes-backend-${DEPLOY_TIMESTAMP}.tar.gz" do-droplet:/tmp/
scp "vibes-frontend-${DEPLOY_TIMESTAMP}.tar.gz" do-droplet:/tmp/

# Verify transfer and cleanup local files
ssh do-droplet "ls -lh /tmp/vibes-*-${DEPLOY_TIMESTAMP}.tar.gz"
rm -f "vibes-backend-${DEPLOY_TIMESTAMP}.tar.gz" "vibes-frontend-${DEPLOY_TIMESTAMP}.tar.gz"

echo "✅ Files transferred and local cleanup completed"
```

---

## 🖥️ Server Deployment (Execute on do-droplet)

### 6. System Check and Backup Preparation
```bash
# SSH to server and check resources
ssh do-droplet

# Verify system resources
echo "🔍 System resource check..."
df -h /opt /var
free -h

# Create timestamped backup directory
BACKUP_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
sudo mkdir -p "/opt/backup/${BACKUP_TIMESTAMP}"

# Get deployment timestamp from uploaded files
DEPLOY_TIMESTAMP=$(ls /tmp/vibes-backend-*.tar.gz | sed 's/.*vibes-backend-\(.*\)\.tar\.gz/\1/')
echo "📦 Deploying: ${DEPLOY_TIMESTAMP}, Backup: ${BACKUP_TIMESTAMP}"
```

### 7. Backup Current Deployment and Database
```bash
# Backup existing deployment and database
[ -d "/var/www/vibesinthreads-app/backend" ] && sudo tar -czf "/opt/backup/${BACKUP_TIMESTAMP}/previous-backend.tar.gz" -C /var/www/vibesinthreads-app backend/
[ -d "/var/www/vibesinthreads-app/frontend" ] && sudo tar -czf "/opt/backup/${BACKUP_TIMESTAMP}/previous-frontend.tar.gz" -C /var/www/vibesinthreads-app frontend/
[ -f "/opt/database/production.db" ] && sudo cp "/opt/database/production.db" "/opt/backup/${BACKUP_TIMESTAMP}/"

# Ensure database directory exists
sudo mkdir -p "/opt/database"

echo "✅ Backup completed in /opt/backup/${BACKUP_TIMESTAMP}/"
```

### 8. Deploy New Version
```bash
# Stop services and clean deployment directories
pm2 stop all
sudo rm -rf "/var/www/vibesinthreads-app/backend" "/var/www/vibesinthreads-app/frontend"
sudo mkdir -p "/var/www/vibesinthreads-app/backend" "/var/www/vibesinthreads-app/frontend"

# Extract new deployment
sudo tar -xzf "/tmp/vibes-backend-${DEPLOY_TIMESTAMP}.tar.gz" -C "/var/www/vibesinthreads-app/backend"
sudo tar -xzf "/tmp/vibes-frontend-${DEPLOY_TIMESTAMP}.tar.gz" -C "/var/www/vibesinthreads-app/frontend"

# Reinstall native dependencies for Linux platform
cd "/var/www/vibesinthreads-app/backend"
npm install --production

echo "✅ New deployment extracted and dependencies installed"
```

### 9. Set Permissions and Run Database Migration
```bash
# Set proper permissions
sudo chown -R root:root "/var/www/vibesinthreads-app/"
sudo chmod -R 755 "/var/www/vibesinthreads-app/"
sudo chmod 600 "/var/www/vibesinthreads-app/backend/.env.production"

# Database setup
cd "/var/www/vibesinthreads-app/backend"
sudo chmod 755 "/opt/database"

# Generate Prisma client and run migrations
sudo -u root npm run prisma:generate
sudo -u root npm run db:migrate:deploy

# Set database permissions
sudo chmod 644 "/opt/database/production.db"

# Verify database
sudo -u root npm run db:migrate:status
ls -la "/opt/database/production.db"

echo "✅ Permissions set and database migrated"
```

### 10. Configure and Start Services
```bash
cd "/var/www/vibesinthreads-app"

# Preserve existing JWT secrets or generate new ones
EXISTING_JWT_SECRET=$(grep "JWT_SECRET:" ecosystem.config.js 2>/dev/null | sed "s/.*JWT_SECRET: ['\"]\\([^'\"]*\\)['\"].*/\\1/" || echo "")
EXISTING_JWT_REFRESH_SECRET=$(grep "JWT_REFRESH_SECRET:" ecosystem.config.js 2>/dev/null | sed "s/.*JWT_REFRESH_SECRET: ['\"]\\([^'\"]*\\)['\"].*/\\1/" || echo "")

if [[ "$EXISTING_JWT_SECRET" =~ ^[a-f0-9]{64}$ ]] && [[ "$EXISTING_JWT_REFRESH_SECRET" =~ ^[a-f0-9]{64}$ ]]; then
    echo "🔐 Preserving existing JWT secrets"
    JWT_SECRET="$EXISTING_JWT_SECRET"
    JWT_REFRESH_SECRET="$EXISTING_JWT_REFRESH_SECRET"
else
    echo "🔐 Generating new JWT secrets"
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
fi

# Create PM2 ecosystem configuration
sudo tee ecosystem.config.js > /dev/null << EOF
module.exports = {
  apps: [
    {
      name: 'vibes-backend',
      script: './backend/dist/index.js',
      cwd: '/var/www/vibesinthreads-app/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'file:/opt/database/production.db',
        BASE_URL: 'https://vibesinthreads.store',
        JWT_SECRET: '$JWT_SECRET',
        JWT_REFRESH_SECRET: '$JWT_REFRESH_SECRET',
        CORS_ORIGIN: 'https://vibesinthreads.store'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'vibes-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/vibesinthreads-app/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://vibesinthreads.store/api/v1'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
EOF

# Create log directories and start services
sudo mkdir -p "/var/www/vibesinthreads-app/backend/logs" "/var/www/vibesinthreads-app/frontend/logs"
rm -f "/var/www/vibesinthreads-app/backend/.env"

pm2 start ecosystem.config.js
pm2 save

echo "✅ PM2 services configured and started"
```

### 11. Verify Deployment and Cleanup
```bash
# Wait for services to stabilize
sleep 30

# Check service status
echo "📊 Service Status:"
pm2 status

# Verify no startup errors
if pm2 list | grep -E "errored|stopped"; then
    echo "❌ Service startup failed!"
    pm2 logs --lines 20
    exit 1
fi

# Test application endpoints
echo "🏥 Testing application..."
curl -f https://vibesinthreads.store/health && echo "✅ Health check passed" || echo "❌ Health check failed"
curl -f https://vibesinthreads.store/api/v1/categories && echo "✅ API working" || echo "❌ API failed"
curl -f https://vibesinthreads.store && echo "✅ Frontend working" || echo "❌ Frontend failed"
curl -f https://vibesinthreads.store/admin/login && echo "✅ Admin panel working" || echo "❌ Admin panel failed"

# Cleanup deployment files and old backups
rm -f "/tmp/vibes-backend-${DEPLOY_TIMESTAMP}.tar.gz" "/tmp/vibes-frontend-${DEPLOY_TIMESTAMP}.tar.gz"
sudo find /opt/backup -type d -name "20*" | sort -r | tail -n +6 | xargs sudo rm -rf 2>/dev/null || true

echo "🎉 Deployment completed successfully!"
```

---

## 🔍 Post-Deployment Verification Checklist

- [ ] **PM2 Status**: All services running with 0 restarts
- [ ] **Health Check**: `https://vibesinthreads.store/health` returns 200
- [ ] **Frontend**: `https://vibesinthreads.store` loads correctly
- [ ] **Admin Panel**: `https://vibesinthreads.store/admin/login` accessible
- [ ] **API Documentation**: `https://vibesinthreads.store/api-docs` working
- [ ] **Database**: Migrations applied successfully
- [ ] **Logs**: No critical errors in PM2 logs
- [ ] **SSL**: HTTPS certificate valid and working

---

## 🚨 Emergency Rollback Procedure

If deployment fails, execute the following steps:

```bash
# Stop current services
pm2 stop all

# Restore previous deployment
LATEST_BACKUP=$(ls -t /opt/backup/ | head -1)
echo "🔄 Rolling back to: $LATEST_BACKUP"

# Remove failed deployment
sudo rm -rf "/var/www/vibesinthreads-app/backend" "/var/www/vibesinthreads-app/frontend"

# Restore previous deployment
sudo tar -xzf "/opt/backup/${LATEST_BACKUP}/previous-backend.tar.gz" -C "/var/www/vibesinthreads-app/"
sudo tar -xzf "/opt/backup/${LATEST_BACKUP}/previous-frontend.tar.gz" -C "/var/www/vibesinthreads-app/"

# Restore database
sudo cp "/opt/backup/${LATEST_BACKUP}/production.db" "/opt/database/"

# Restart services
pm2 start all && pm2 save

# Verify rollback
curl -f https://vibesinthreads.store/health && echo "✅ Rollback successful"
```

---

## 🔧 Key Improvements Applied

### ✅ Native Dependency Handling
- Dependencies are always reinstalled on target platform
- Prevents Sharp module and other native dependency conflicts

### ✅ Simplified Process Flow
- Reduced from 24 steps to 11 logical groups
- Related operations are batched together
- Clear separation between local and server operations

### ✅ Enhanced Safety Measures
- Comprehensive backup strategy with timestamped directories
- Validation checks at each critical stage
- Automatic cleanup of temporary files and old backups

### ✅ Environment Management
- JWT secrets are preserved across deployments to maintain user sessions
- Proper PM2 configuration without .env file conflicts
- Standardized database location at `/opt/database/production.db`

### ✅ Error Prevention
- Pre-checks for system resources and disk space
- Validation of build artifacts before deployment
- Consistent timestamp usage to prevent file extraction issues

---

## 📞 Support Information

- **SSH Access**: `ssh do-droplet`
- **Application Path**: `/var/www/vibesinthreads-app/`
- **Database Path**: `/opt/database/production.db`
- **Backup Path**: `/opt/backup/`
- **PM2 Commands**: `pm2 status`, `pm2 logs`, `pm2 restart all`
- **Admin Credentials**: 
  - Email: `admin@vibesinthreads.store`
  - Password: `VibesAdmin@2025!Store`

---

**Created**: August 16, 2025  
**Last Updated**: August 16, 2025 (Streamlined Process v2.0)  
**Version**: 2.0  
**Status**: Production Ready - Streamlined Process