# Complete Production Deployment Plan - Vibes in Threads

## 🎯 Deployment Overview
Deploy full-stack e-commerce application to DigitalOcean droplet with SQLite database, production builds, and auto-restart capabilities.

## 📋 Pre-Deployment Checklist
✅ Server: Ubuntu droplet with reserved IP (178.128.130.14)  
✅ SSH: Key-based access configured  
✅ Domain: vibesinthreads.store pointing to server  
✅ SSL: Let's Encrypt certificate installed  
✅ Web Server: Nginx running with basic configuration  

## 🚀 Deployment Steps

### ⚡ Quick Deployment (Recommended)

**For streamlined deployment, use the automated script after server setup:**

```bash
# On production server, navigate to application directory
cd /var/www/vibesinthreads-app

# Run automated deployment script
./deploy.sh v1.0.0
```

**For emergency rollback:**
```bash
./emergency-rollback.sh prod.db.backup.20250815-140000 v1.0.0
```

### 1. Server Environment Setup
```bash
# Update system and install Node.js 18+
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally for process management
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/vibesinthreads-app
sudo chown root:root /var/www/vibesinthreads-app
```

### 2. Application Deployment
```bash
# Clone repository
cd /var/www/vibesinthreads-app
git clone https://github.com/sibinsv/vibesinthreads.git .

# Backend setup
cd backend
npm ci --production
# Install required dev dependencies for TypeScript compilation
npm install --save-dev @types/jsonwebtoken @types/cors @types/morgan typescript ts-node @types/node
npm run build

# Frontend setup  
cd ../frontend
npm ci --production
# Install required dev dependencies for TypeScript compilation
npm install --save-dev typescript @types/node @types/react @types/react-dom

# Build with production environment variables (CRITICAL for API URL)
# The repository includes .env.production with correct API URL
NEXT_PUBLIC_API_URL='https://vibesinthreads.store/api/v1' npm run build

# Note: next.config.ts has been updated to handle production build errors gracefully
```

### 2.5. Create Git Release Tag
```bash
# Navigate back to project root
cd /var/www/vibesinthreads-app

# Create production release tag
git tag -a v1.0.0 -m "Production release v1.0.0 - Initial deployment to vibesinthreads.store"
git push origin v1.0.0

# Alternative: Create release with current date (if preferred)
# git tag -a "release-$(date +%Y%m%d)" -m "Production deployment $(date +%Y-%m-%d)"
# git push origin "release-$(date +%Y%m%d)"

# Verify tag was created
git tag -l
git log --oneline -1
```

### 3. Database & Environment Configuration
```bash
# Create production environment file
cd /var/www/vibesinthreads-app/backend
# Generate secure JWT secrets
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

sudo tee .env.production <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="$JWT_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
CORS_ORIGIN="https://vibesinthreads.store"
EOF

# Set proper permissions
sudo chmod 600 .env.production

# Initialize database (handle environment variables explicitly)
DATABASE_URL="file:./prisma/prod.db" npm run db:sync
DATABASE_URL="file:./prisma/prod.db" npm run prisma:generate  
DATABASE_URL="file:./prisma/prod.db" npm run db:seed
# Note: NOT running db:seed-dev (test data) in production

# Create uploads directory
sudo mkdir -p uploads/images uploads/thumbnails
sudo chmod 755 uploads uploads/images uploads/thumbnails

# Verify database file location and set permissions
find /var/www/vibesinthreads-app -name "*.db" -type f
# Set permissions on actual database file (may be in nested prisma/ directory)
sudo chmod 644 /var/www/vibesinthreads-app/backend/prisma/prisma/prod.db
```

### 4. PM2 Process Management Setup
```bash
# PM2 ecosystem configuration (✅ Already included in repository)
# File: ecosystem.config.js contains production-ready configuration
# with embedded environment variables (avoids env_file reliability issues)

# The deployment script will automatically:
# 1. Generate secure JWT secrets
# 2. Replace placeholders in ecosystem.config.js
# 3. Start services with PM2

# Manual setup (if not using automated script):
cd /var/www/vibesinthreads-app

# Generate secure JWT secrets
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Replace placeholders in ecosystem.config.js
sed -i "s/REPLACE_WITH_JWT_SECRET_DURING_DEPLOYMENT/$JWT_SECRET/g" ecosystem.config.js
sed -i "s/REPLACE_WITH_JWT_REFRESH_SECRET_DURING_DEPLOYMENT/$JWT_REFRESH_SECRET/g" ecosystem.config.js

# Create logs directory
sudo mkdir -p /var/www/vibesinthreads-app/logs

# Start applications with PM2
cd /var/www/vibesinthreads-app
pm2 start ecosystem.config.js

# Verify applications are running stable (check for 0 restarts)
sleep 10
pm2 status

# Save configuration and enable startup
pm2 save
pm2 startup
```

### 5. Nginx Configuration Update
```bash
# Update Nginx configuration (fixed syntax for modern nginx)
sudo tee /etc/nginx/sites-available/vibesinthreads.store <<EOF
server {
    listen 80;
    server_name vibesinthreads.store www.vibesinthreads.store;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name vibesinthreads.store www.vibesinthreads.store;

    ssl_certificate /etc/letsencrypt/live/vibesinthreads.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vibesinthreads.store/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API routes (backend)
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API docs
    location /api-docs {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Upload files (static serving)
    location /uploads/ {
        alias /var/www/vibesinthreads-app/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend application (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Gzip compression (fixed syntax)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# Test configuration before applying (critical step)
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx configuration updated successfully"
else
    echo "❌ Nginx configuration test failed - check syntax"
    exit 1
fi
```

### 6. Security & Firewall Setup
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Set file permissions
sudo chown -R root:root /var/www/vibesinthreads-app
sudo chmod -R 755 /var/www/vibesinthreads-app
sudo chmod 644 /var/www/vibesinthreads-app/backend/prisma/prod.db
```

### 7. Monitoring & Log Setup
```bash
# Set up log rotation for PM2
sudo tee /etc/logrotate.d/pm2 <<EOF
/var/www/vibesinthreads-app/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

## 🔧 Final Configuration

### Environment Variables
- **Backend**: Production environment with secure JWT secrets
- **Frontend**: API URL pointing to production domain
- **Database**: SQLite file with proper permissions

### Production Data Strategy
- **Admin User**: Created via `npm run db:seed` (production-safe)
- **Test Data**: NOT seeded in production (no `db:seed-dev`)
- **Categories/Products**: Manually created via admin panel after deployment

### Auto-Restart Configuration  
- **PM2**: Configured for system startup (survives reboots)
- **Nginx**: Already configured for auto-start
- **Services**: Both frontend/backend restart automatically

### SSL & Security
- **HTTPS**: Enforced with automatic HTTP redirect
- **Headers**: Security headers configured
- **Firewall**: Only SSH, HTTP, HTTPS ports open

## ✅ Post-Deployment Verification

1. **Health Check**: `curl https://vibesinthreads.store/health`
2. **API Documentation**: Visit `https://vibesinthreads.store/api-docs`
3. **Frontend**: Visit `https://vibesinthreads.store`
4. **Admin Login**: Visit `https://vibesinthreads.store/admin/login`
5. **PM2 Status**: `pm2 status` (should show both apps running)

## 🎉 Expected Result
- ✅ Full e-commerce application live at https://vibesinthreads.store
- ✅ Admin panel accessible with default credentials (admin@vibesinthreads.store / VibesAdmin@2025!Store)
- ✅ API documentation available at /api-docs
- ✅ Image uploads working with proper serving
- ✅ Automatic restart after server reboots
- ✅ Production-optimized builds running
- ✅ SQLite database with sample data populated

## 🚀 Future Releases Strategy

### Semantic Versioning Approach
- **Major releases** (v2.0.0): Breaking changes, major architecture updates, API changes
- **Minor releases** (v1.1.0): New features, enhancements, backwards compatible changes
- **Patch releases** (v1.0.1): Bug fixes, security patches, minor improvements

### Release Workflow

#### 1. Development Process
```bash
# Create feature branch
git checkout -b feature/new-payment-gateway
# Develop and test locally
# Create pull request to main branch
```

#### 2. Pre-Release Steps
```bash
# Update version numbers
cd backend && npm version minor  # Updates package.json version
cd ../frontend && npm version minor

# Create changelog entry
echo "## v1.1.0 - $(date +%Y-%m-%d)
- Added new payment gateway integration
- Fixed image upload validation
- Enhanced admin dashboard performance" >> CHANGELOG.md

# Commit version updates
git add .
git commit -m "Bump version to v1.1.0"
```

#### 3. Release Deployment
```bash
# SSH to production server
ssh do-droplet

# Navigate to application directory
cd /var/www/vibesinthreads-app

# Pull latest changes
git pull origin main

# Checkout specific release tag
git checkout v1.1.0

# Backup current database (safety measure)
cp backend/prisma/prod.db backend/prisma/prod.db.backup.$(date +%Y%m%d-%H%M%S)

# Run any new database migrations
cd backend
npm run db:migrate:deploy

# Rebuild applications
npm run build
cd ../frontend
npm run build

# Graceful restart (zero-downtime)
pm2 reload all

# Verify deployment
pm2 status
curl -f https://vibesinthreads.store/health
```

#### 4. Post-Deployment Verification
```bash
# Check application logs
pm2 logs --lines 50

# Test critical functionality
curl -f https://vibesinthreads.store/api/v1/categories
curl -f https://vibesinthreads.store/admin/login

# Monitor for 10-15 minutes for any issues
pm2 monit
```

### Zero-Downtime Deployment Features

#### PM2 Reload Strategy
```bash
# Graceful restart - serves old version while new version starts
pm2 reload vibes-backend
pm2 reload vibes-frontend

# Or reload all apps
pm2 reload all
```

#### Health Check Integration
```bash
# Automated health verification script
#!/bin/bash
echo "Deploying new release..."
pm2 reload all

# Wait for services to start
sleep 10

# Verify health
if curl -f https://vibesinthreads.store/health; then
    echo "✅ Deployment successful"
    # Clean up old backups (keep last 5)
    ls -t backend/prisma/prod.db.backup.* | tail -n +6 | xargs rm -f
else
    echo "❌ Deployment failed - consider rollback"
    exit 1
fi
```

### Rollback Strategy

#### Quick Rollback Process
```bash
# If issues detected, quick rollback to previous version
cd /var/www/vibesinthreads-app

# Checkout previous stable tag
git checkout v1.0.0

# Restore database if needed (for major releases)
# cp backend/prisma/prod.db.backup.20250815-143000 backend/prisma/prod.db

# Rebuild and restart
cd backend && npm run build
cd ../frontend && npm run build
pm2 reload all

# Verify rollback
curl -f https://vibesinthreads.store/health
```

#### Database Rollback Considerations
```bash
# For releases with database schema changes:

# 1. Always backup before deployment
cp backend/prisma/prod.db backend/prisma/prod.db.pre-v1.1.0

# 2. Test migrations on copy first
cp backend/prisma/prod.db backend/prisma/test.db
DATABASE_URL="file:./prisma/test.db" npm run db:sync

# 3. Keep migration rollback scripts ready
# (Prisma doesn't support automatic rollbacks)
```

### Release Management Best Practices

#### Version Tagging Convention
```bash
# Production releases
git tag -a v1.1.0 -m "Release v1.1.0 - Payment gateway integration"

# Release candidates (for testing)
git tag -a v1.1.0-rc.1 -m "Release candidate v1.1.0-rc.1"

# Hotfix releases
git tag -a v1.0.1 -m "Hotfix v1.0.1 - Security patch"
```

#### Deployment Checklist
- [ ] All tests passing locally
- [ ] Database backup created
- [ ] Version numbers updated
- [ ] Changelog updated
- [ ] Release tag created and pushed
- [ ] Deployment completed successfully
- [ ] Health checks passing
- [ ] Critical functionality verified
- [ ] Monitoring for issues (15+ minutes)

#### ✅ Automated Deployment Script (Already Implemented)

The repository now includes a complete automated deployment script: `deploy.sh`

**Key Features:**
- 🔐 **Secure JWT secret generation** 
- 📦 **Automatic database backup** (handles both possible locations)
- 🏗️ **Complete build process** with required dependencies
- 🗄️ **Database migration support**
- 🔄 **Graceful service restart**
- 🏥 **Health check verification**
- 🧹 **Automatic backup cleanup**

**Usage:**
```bash
# Make executable (one-time setup)
chmod +x deploy.sh

# Deploy specific version
./deploy.sh v1.1.0

# The script handles all deployment steps automatically:
# 1. Database backup
# 2. Code checkout
# 3. Secure secret generation
# 4. Dependency installation (including required dev deps)
# 5. Production builds with correct environment variables
# 6. Database migrations
# 7. Service restart
# 8. Health verification
```

**Emergency Rollback Script:** `emergency-rollback.sh`
```bash
# Quick rollback with database restoration
./emergency-rollback.sh prod.db.backup.20250815-140000 v1.0.0
```

## 🗃️ Database Migration Strategy

### Migration Setup & Commands

#### Initial Migration Setup (✅ Already Completed)
```bash
# Migration commands already added to package.json
# Initial migration already created: 20250815103817_init

# Migration files structure:
# backend/prisma/migrations/
# ├── 20250815103817_init/
# │   └── migration.sql
# └── migration_lock.toml

# To verify migration status:
cd backend
npm run db:migrate:status
```

#### Production Migration Commands
```bash
# Check migration status
npm run db:migrate:status

# Apply pending migrations (production safe)
npm run db:migrate:deploy

# Development migration (creates new migration)
npm run db:migrate:dev --name "add-user-preferences"
```

### Safe Migration Practices

#### Pre-Migration Checklist
```bash
# 1. Backup production database
cp backend/prisma/prod.db backend/prisma/prod.db.pre-migration.$(date +%Y%m%d-%H%M%S)

# 2. Test migration on database copy
cp backend/prisma/prod.db backend/prisma/test-migration.db
DATABASE_URL="file:./prisma/test-migration.db" npm run db:migrate:deploy

# 3. Check migration status
npm run db:migrate:status

# 4. Verify test database integrity
DATABASE_URL="file:./prisma/test-migration.db" npm run prisma:studio
```

#### Migration Best Practices
```bash
# Create descriptive migration names
npx prisma migrate dev --name "add-user-email-verification"
npx prisma migrate dev --name "update-product-pricing-structure"

# Always review generated SQL before applying
# Migration files: prisma/migrations/*/migration.sql

# For data migrations, create separate scripts
# Example: prisma/data-migrations/update-user-roles.ts
```

### Complex Migration Scenarios

#### Adding Non-Nullable Columns
```sql
-- Bad: Will fail if table has data
ALTER TABLE users ADD COLUMN phone TEXT NOT NULL;

-- Good: Add with default, then update
ALTER TABLE users ADD COLUMN phone TEXT DEFAULT '';
-- Update existing records with real data
-- Remove default in next migration if needed
```

#### Large Table Migrations
```bash
# For tables with >100k records, consider:
# 1. Batch updates in smaller chunks
# 2. Background migration with feature flags
# 3. Blue-green deployment strategy
```

#### Schema Changes with Data Transformation
```bash
# Create separate migrations for:
# 1. Schema changes (add/remove columns)
# 2. Data transformation (update existing data)
# 3. Cleanup (remove old columns after verification)

# Example sequence:
npx prisma migrate dev --name "add-user-full-name-column"
# Run data migration script to populate full_name
npx prisma migrate dev --name "remove-user-first-last-name-columns"
```

### Migration Rollback Strategy

#### Schema-Only Rollbacks
```bash
# For simple schema changes, restore from backup
cp backend/prisma/prod.db.pre-migration.20250815-140000 backend/prisma/prod.db
pm2 restart vibes-backend
```

#### Complex Migration Rollbacks
```bash
# Create rollback migrations manually
# prisma/rollbacks/rollback-v1.1.0.sql

# Example rollback for adding column:
-- Rollback for: ADD COLUMN user_preferences TEXT
ALTER TABLE users DROP COLUMN user_preferences;
```

#### ✅ Emergency Rollback Procedure (Automated Script Available)

The repository includes a comprehensive emergency rollback script: `emergency-rollback.sh`

**Features:**
- 🛑 **Safe service stopping** to prevent data corruption
- 🗄️ **Database restoration** with path verification
- 📝 **Code version rollback** with rebuild
- 🔄 **Service restart** with health verification
- 📋 **Comprehensive error handling**

**Usage:**
```bash
# Basic rollback (database + code)
./emergency-rollback.sh prod.db.backup.20250815-140000

# Rollback to specific version
./emergency-rollback.sh prod.db.backup.20250815-140000 v1.0.0

# The script automatically:
# 1. Stops all services safely
# 2. Restores database from backup
# 3. Checks out specified code version
# 4. Rebuilds applications
# 5. Restarts services
# 6. Verifies health check
```

**Manual Emergency Steps (if script fails):**
```bash
# Stop services
pm2 stop all

# Restore database (check both possible locations)
cp backend/prisma/prod.db.backup.20250815-140000 backend/prisma/prod.db
# OR if in nested directory:
cp backend/prisma/prisma/prod.db.backup.20250815-140000 backend/prisma/prisma/prod.db

# Rollback code and restart
git checkout v1.0.0
pm2 start all
```

### Migration Monitoring

#### Pre-Deployment Checks
```bash
# Verify migration status before deployment
ssh do-droplet 'cd /var/www/vibesinthreads-app/backend && npm run db:migrate:status'

# Expected output for clean state:
# Database schema is up to date!
```

#### Post-Migration Verification
```bash
# Verify database integrity after migration
npx prisma validate
npm run db:migrate:status

# Test critical queries
curl -f https://vibesinthreads.store/api/v1/categories
curl -f https://vibesinthreads.store/api/v1/products
```

#### Migration Performance Monitoring
```bash
# Time long-running migrations
time npm run db:migrate:deploy

# Monitor SQLite database size
ls -lh backend/prisma/prod.db

# Check for locked tables (SQLite specific)
# If migration hangs, may need to restart application first
```

### Development vs Production Migration Workflow

#### Development Workflow
```bash
# Make schema changes in prisma/schema.prisma
# Generate and apply migration
npm run db:migrate:dev --name "descriptive-change-name"

# Prisma will:
# 1. Generate migration SQL
# 2. Apply to development database  
# 3. Regenerate Prisma client
```

#### Production Workflow
```bash
# 1. Create and test migration in development
npm run db:migrate:dev --name "add-payment-methods"

# 2. Commit migration files
git add prisma/migrations/
git commit -m "Add payment methods migration"

# 3. Deploy to production (migrations run automatically in deployment script)
./deploy.sh v1.2.0
```

### Migration File Management

#### Migration File Structure
```
prisma/
├── migrations/
│   ├── 20250815100000_init/
│   │   └── migration.sql
│   ├── 20250820120000_add_user_preferences/
│   │   └── migration.sql
│   └── migration_lock.toml
```

#### Migration Cleanup
```bash
# Never delete migration files in production
# For development reset:
npm run db:migrate:reset  # Recreates database from scratch

# Keep migration history clean by squashing during development
# But never squash migrations that have been deployed to production
```

## 🔄 Future Migration to PostgreSQL

When ready to scale, migration steps:

1. **Export SQLite data** using Prisma migrate diff
2. **Set up PostgreSQL** database
3. **Update Prisma schema** provider from "sqlite" to "postgresql"  
4. **Generate migration** for PostgreSQL
5. **Import data** and run migrations
6. **Update DATABASE_URL** and deploy
7. **Test thoroughly** before switching traffic

## 📞 Support Information

- **SSH Access**: `ssh do-droplet` or `ssh root@178.128.130.14`
- **Application Path**: `/var/www/vibesinthreads-app/`
- **PM2 Commands**: `pm2 status`, `pm2 logs`, `pm2 restart all`
- **Nginx Config**: `/etc/nginx/sites-available/vibesinthreads.store`
- **SSL Cert**: Auto-renews via Let's Encrypt

## 🚨 Known Issues and Fixes

During the actual deployment on August 15, 2025, several issues were encountered and resolved. See `DEPLOYMENT_ISSUES_AND_FIXES.md` for detailed documentation.

### Key Issues Resolved:
1. **Backend TypeScript Build**: Missing type definitions in production ✅
2. **Frontend Compilation**: Strict TypeScript errors blocking build ✅
3. **PM2 Environment Variables**: `env_file` parameter not working reliably ✅
4. **Nginx Configuration**: Deprecated syntax and invalid directives ✅
5. **Database Path**: Nested directory structure not matching expectations ✅
6. **Dependencies**: Dev dependencies required for production builds ✅
7. **Frontend API URL**: Build-time environment variable configuration ✅

### ⚡ New Automation Features (August 15, 2025 Update):
- 🤖 **Automated Deployment Script**: `deploy.sh` handles entire deployment process
- 🚨 **Emergency Rollback Script**: `emergency-rollback.sh` for quick recovery
- 🛠️ **Production-Ready Configuration**: 
  - `ecosystem.config.js` with embedded environment variables
  - `frontend/.env.production` for correct API URL
  - `backend/.env.production` template with security guidance
- 📊 **Database Migration System**: Prisma migrations initialized and ready
- 🔐 **Enhanced Security**: Unique JWT secret generation and proper permissions

### Critical Success Factors:
- ✅ Embed environment variables directly in PM2 config
- ✅ Install TypeScript dev dependencies even in production  
- ✅ Test Nginx configuration before applying
- ✅ Verify actual file paths after operations
- ✅ Monitor PM2 logs for stability
- ✅ **Use automated scripts for reliable deployment**
- ✅ **Set environment variables at build time for Next.js**

### 🎯 Deployment Recommendations:
1. **Use `./deploy.sh v1.0.0`** for all deployments (recommended)
2. **Manual deployment only for troubleshooting** (use updated manual steps)
3. **Always test on staging environment first**
4. **Keep emergency rollback script ready**: `./emergency-rollback.sh`

---
**Created**: August 15, 2025  
**Last Updated**: August 15, 2025 (Major update: Added automation scripts and fixes)  
**Status**: ✅ Production-ready with comprehensive automation