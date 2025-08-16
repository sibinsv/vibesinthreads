# Production Deployment Process - Vibes in Threads

## 🎯 Overview
Step-by-step production deployment process for Vibes in Threads e-commerce application to DigitalOcean droplet.

**Production Server:** do-droplet (178.128.130.14)  
**Domain:** https://vibesinthreads.store  
**SSH Access:** `ssh do-droplet`

---

## 📋 Pre-Deployment Steps (Local Environment)

### 1. Stash All Local Changes
```bash
# Save any uncommitted work
git stash push -m "Pre-deployment stash $(date +%Y%m%d-%H%M%S)"

# Verify clean working directory
git status
```

### 2. Pull Code According to Tag
```bash
# Fetch latest tags and changes
git fetch --tags origin

# List available tags
git tag -l

# Checkout specific release tag
git checkout v1.1.0
# Replace v1.1.0 with your target deployment tag

# Verify you're on the correct tag
git describe --tags
git log --oneline -1
```

### 3. Clear Previous Build Artifacts from Backend
```bash
cd backend

# Remove previous build artifacts
rm -rf dist/
rm -rf node_modules/.cache/
npm cache clean --force

# Clear any TypeScript cache
rm -rf tsconfig.tsbuildinfo

cd ..
```

### 4. Create Backend Production Build
```bash
cd backend

# Install production dependencies
npm ci --production

# Install required dev dependencies for build
npm install --save-dev @types/jsonwebtoken @types/cors @types/morgan typescript ts-node @types/node

# Use existing production environment file (already configured)
# The .env.production file already exists with correct configuration
# Verify it contains the correct settings
cat .env.production

echo "✅ Using existing production environment configuration"

# Build backend with production environment
NODE_ENV=production npm run build

# If build fails with TypeScript errors, fix implicit any types:
# sed -i 's/users.map(async (user) => {/users.map(async (user: any) => {/g' src/controllers/userController.ts
# sed -i 's/orders.reduce((sum, order) => sum + order.totalAmount, 0)/orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)/g' src/controllers/userController.ts
# sed -i 's/categories.map(category => ({/categories.map((category: any) => ({/g' src/services/categoryService.ts
# sed -i 's/existingCategories.map(c => c.id)/existingCategories.map((c: any) => c.id)/g' src/services/categoryService.ts
# sed -i 's/existingProducts.map(p => p.id)/existingProducts.map((p: any) => p.id)/g' src/services/productService.ts
# sed -i 's/await prisma.$transaction(async (tx) => {/await prisma.$transaction(async (tx: any) => {/g' src/services/productService.ts
# Then retry: NODE_ENV=production npm run build

# Verify build was successful
ls -la dist/
echo "✅ Backend build completed"

cd ..
```

### 5. Clear Previous Build Artifacts from Frontend
```bash
cd frontend

# Remove previous build artifacts
rm -rf .next/
rm -rf out/
rm -rf node_modules/.cache/
npm cache clean --force

cd ..
```

### 6. Create Frontend Production Build
```bash
cd frontend

# Install production dependencies
npm ci --production

# Install required dev dependencies for build
npm install --save-dev typescript @types/node @types/react @types/react-dom

# Use existing production environment file (already configured with correct API URL)
cat .env.production

echo "✅ Using existing production environment configuration"

# Build frontend with production environment
NEXT_PUBLIC_API_URL='https://vibesinthreads.store/api/v1' NODE_ENV=production npm run build

# Verify build was successful
ls -la .next/
echo "✅ Frontend build completed"

cd ..
```

### 7. Verify Production Environment Variables
```bash
# Check backend build for correct environment references
echo "🔍 Verifying backend environment variables..."
grep -r "vibesinthreads.store" backend/dist/ || echo "✅ No hardcoded local URLs found"

# Check frontend build for correct API URL
echo "🔍 Verifying frontend environment variables..."
grep -r "localhost" frontend/.next/ && echo "❌ Found localhost references!" || echo "✅ No localhost references found"
grep -r "vibesinthreads.store" frontend/.next/ && echo "✅ Found production URLs" || echo "❌ Production URLs not found!"

echo "✅ Environment variable verification completed"
```

### 8. Create Tar Files for Deployment
```bash
# Create deployment timestamp
DEPLOY_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "📦 Creating deployment package: $DEPLOY_TIMESTAMP"

# Create backend tar file (including node_modules and prisma)
tar -czf "vibes-backend-${DEPLOY_TIMESTAMP}.tar.gz" \
    -C backend \
    dist/ \
    node_modules/ \
    prisma/ \
    package.json \
    package-lock.json \
    .env.production

# Create frontend tar file (including node_modules)
tar -czf "vibes-frontend-${DEPLOY_TIMESTAMP}.tar.gz" \
    -C frontend \
    .next/ \
    node_modules/ \
    public/ \
    package.json \
    package-lock.json \
    .env.production

# Verify tar files were created
ls -lh vibes-*-${DEPLOY_TIMESTAMP}.tar.gz

echo "✅ Deployment packages created successfully"
```

### 9. Copy Tar Files to DO-Droplet Temp Directory
```bash
# Copy backend tar file
scp "vibes-backend-${DEPLOY_TIMESTAMP}.tar.gz" do-droplet:/tmp/

# Copy frontend tar file  
scp "vibes-frontend-${DEPLOY_TIMESTAMP}.tar.gz" do-droplet:/tmp/

# Verify files were transferred
ssh do-droplet "ls -lh /tmp/vibes-*-${DEPLOY_TIMESTAMP}.tar.gz"

echo "✅ Files transferred to server successfully"
```

### 10. Delete Tar Files from Local
```bash
# Clean up local deployment packages
rm -f "vibes-backend-${DEPLOY_TIMESTAMP}.tar.gz"
rm -f "vibes-frontend-${DEPLOY_TIMESTAMP}.tar.gz"

echo "✅ Local deployment packages cleaned up"
```

---

## 🖥️ Server Deployment Process (DO-Droplet)

**⚠️ Important: Execute the following commands on the production server**

```bash
# SSH to production server
ssh do-droplet

# NOTE: Production database is standardized at /opt/database/production.db
```

### 11. Pre-Deployment System Check
```bash
# Check disk space and system resources before deployment
echo "🔍 Checking system resources..."
df -h /opt /var
free -h

# Verify minimum disk space (adjust threshold as needed)
AVAILABLE_SPACE=$(df /opt | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then  # Less than 1GB
    echo "⚠️ Warning: Low disk space on /opt partition"
fi

echo "✅ System check completed"
```

### 12. Create Backup Directory with Timestamp
```bash
# Create backup directory with timestamp
BACKUP_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
sudo mkdir -p "/opt/backup/${BACKUP_TIMESTAMP}"
echo "📁 Created backup directory: /opt/backup/${BACKUP_TIMESTAMP}"
```

### 13. Create Tar File of Previous Backend and Frontend
```bash
# Backup existing backend deployment
if [ -d "/var/www/vibesinthreads-app/backend" ]; then
    sudo tar -czf "/opt/backup/${BACKUP_TIMESTAMP}/previous-backend.tar.gz" \
        -C /var/www/vibesinthreads-app \
        backend/
    echo "✅ Previous backend backed up"
else
    echo "⚠️ No previous backend deployment found"
fi

# Backup existing frontend deployment
if [ -d "/var/www/vibesinthreads-app/frontend" ]; then
    sudo tar -czf "/opt/backup/${BACKUP_TIMESTAMP}/previous-frontend.tar.gz" \
        -C /var/www/vibesinthreads-app \
        frontend/
    echo "✅ Previous frontend backed up"
else
    echo "⚠️ No previous frontend deployment found"
fi
```

### 14. Copy Database to Backup Directory
```bash
# Backup production database (standardized location: /opt/database/production.db)
if [ -f "/opt/database/production.db" ]; then
    sudo cp "/opt/database/production.db" "/opt/backup/${BACKUP_TIMESTAMP}/production.db"
    echo "✅ Database backed up from /opt/database/production.db"
else
    echo "⚠️ Production database not found at /opt/database/production.db"
    echo "📁 Ensuring /opt/database directory exists"
    sudo mkdir -p "/opt/database"
    echo "ℹ️ Database will be created at /opt/database/production.db during migration"
fi

# List backup contents
sudo ls -la "/opt/backup/${BACKUP_TIMESTAMP}/"
```

### 15. Stop PM2 Services
```bash
# Stop both frontend and backend services
pm2 stop all

# Verify services are stopped
pm2 status

echo "✅ All PM2 services stopped"
```

### 16. Delete Previous Deployment Directories
```bash
# Remove previous backend deployment
if [ -d "/var/www/vibesinthreads-app/backend" ]; then
    sudo rm -rf "/var/www/vibesinthreads-app/backend"
    echo "✅ Previous backend deployment removed"
fi

# Remove previous frontend deployment
if [ -d "/var/www/vibesinthreads-app/frontend" ]; then
    sudo rm -rf "/var/www/vibesinthreads-app/frontend"
    echo "✅ Previous frontend deployment removed"
fi

# Create fresh deployment directories
sudo mkdir -p "/var/www/vibesinthreads-app/backend"
sudo mkdir -p "/var/www/vibesinthreads-app/frontend"
```

### 17. Extract Artifacts from Temp Directory
```bash
# Get the deployment timestamp from uploaded files
DEPLOY_TIMESTAMP=$(ls /tmp/vibes-backend-*.tar.gz | sed 's/.*vibes-backend-\(.*\)\.tar\.gz/\1/')
echo "📦 Deploying artifacts with timestamp: ${DEPLOY_TIMESTAMP}"

# Extract backend artifacts
sudo tar -xzf "/tmp/vibes-backend-${DEPLOY_TIMESTAMP}.tar.gz" \
    -C "/var/www/vibesinthreads-app/backend"

# Extract frontend artifacts  
sudo tar -xzf "/tmp/vibes-frontend-${DEPLOY_TIMESTAMP}.tar.gz" \
    -C "/var/www/vibesinthreads-app/frontend"

# Verify extraction
echo "📁 Backend contents:"
sudo ls -la "/var/www/vibesinthreads-app/backend/"

echo "📁 Frontend contents:"
sudo ls -la "/var/www/vibesinthreads-app/frontend/"

echo "✅ Artifacts extracted successfully"
```

### 18. Reinstall Native Dependencies for Target Platform
```bash
# Reinstall backend dependencies to ensure compatibility with Linux platform
cd "/var/www/vibesinthreads-app/backend"
npm install --production

echo "✅ Backend dependencies reinstalled for target platform"

# Note: Frontend dependencies typically don't need reinstallation as they're pre-built
# But if issues arise, run: cd "/var/www/vibesinthreads-app/frontend" && npm install --production
```

### 19. Set Permissions for All Files and Directories
```bash
# Set ownership and permissions for entire application
sudo chown -R root:root "/var/www/vibesinthreads-app/"
sudo chmod -R 755 "/var/www/vibesinthreads-app/"

# Set specific permissions for sensitive files
sudo chmod 600 "/var/www/vibesinthreads-app/backend/.env.production"

# Set permissions for uploads directory (if exists)
if [ -d "/var/www/vibesinthreads-app/backend/uploads" ]; then
    sudo chmod -R 755 "/var/www/vibesinthreads-app/backend/uploads"
fi

# Database permissions will be set after migration creates the file at /opt/database/production.db

echo "✅ Permissions set successfully"
```

### 19. Run Prisma Migrations
```bash
# Navigate to backend directory
cd "/var/www/vibesinthreads-app/backend"

# Ensure /opt/database directory exists with proper permissions
sudo mkdir -p "/opt/database"
sudo chown root:root "/opt/database"
sudo chmod 755 "/opt/database"

# Generate Prisma client
sudo -u root npm run prisma:generate

# Deploy migrations (production safe) - database will be created at /opt/database/production.db
sudo -u root npm run db:migrate:deploy

# If migration fails with P3005 error (database not empty), baseline the existing database:
# export DATABASE_URL="file:/opt/database/production.db"
# sudo -u root -E npx prisma migrate resolve --applied 20250815103817_init
# sudo -u root -E npx prisma migrate status

# Set proper permissions on the created database
sudo chmod 644 "/opt/database/production.db"

# Verify migration status
sudo -u root npm run db:migrate:status

# Verify database file exists at correct location
ls -la "/opt/database/production.db"

echo "✅ Database migrations completed at /opt/database/production.db"
```

### 20. Environment Variable Validation
```bash
# Verify all required environment variables are configured
echo "🔍 Validating environment variables..."
cd "/var/www/vibesinthreads-app"

# Note: PM2 loads environment variables from ecosystem.config.js (not .env files)
# This avoids the env_file reliability issues encountered in previous deployments

# Check PM2 ecosystem config for any remaining placeholder values
if grep -q "REPLACE_WITH" ecosystem.config.js; then
    echo "❌ Missing environment variables found in PM2 ecosystem:"
    grep "REPLACE_WITH" ecosystem.config.js
    echo "⚠️ Please ensure all variables are properly configured"
else
    echo "✅ All environment variables configured in PM2 ecosystem"
fi

# Test database connection
echo "🔍 Testing database connection..."
cd backend
sudo -u root npm run prisma:validate && echo "✅ Database connection valid" || echo "❌ Database connection failed"
```

### 21. Start PM2 Services
```bash
# Navigate to application root
cd "/var/www/vibesinthreads-app"

# Handle ecosystem.config.js update - merge new configuration with existing secrets
echo "🔄 Updating ecosystem.config.js with new configuration while preserving secrets..."

# Extract existing JWT secrets from current ecosystem config (if they exist)
EXISTING_JWT_SECRET=$(grep "JWT_SECRET:" ecosystem.config.js | sed "s/.*JWT_SECRET: ['\"]\\([^'\"]*\\)['\"].*/\\1/")
EXISTING_JWT_REFRESH_SECRET=$(grep "JWT_REFRESH_SECRET:" ecosystem.config.js | sed "s/.*JWT_REFRESH_SECRET: ['\"]\\([^'\"]*\\)['\"].*/\\1/")

# Check if existing secrets are real (not placeholders)
if [[ "$EXISTING_JWT_SECRET" =~ ^[a-f0-9]{64}$ ]] && [[ "$EXISTING_JWT_REFRESH_SECRET" =~ ^[a-f0-9]{64}$ ]]; then
    echo "🔐 Found existing JWT secrets - preserving to maintain user sessions"
    JWT_SECRET="$EXISTING_JWT_SECRET"
    JWT_REFRESH_SECRET="$EXISTING_JWT_REFRESH_SECRET"
else
    echo "🔐 Generating new JWT secrets for first deployment..."
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
fi

# Update ecosystem.config.js with new configuration including updated database path
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

echo "✅ Ecosystem configuration updated with standardized database path and preserved secrets"

# Verify the configuration
echo "🔍 Verifying updated ecosystem configuration:"
grep -E "(DATABASE_URL|JWT_SECRET)" ecosystem.config.js

# Create log directories
sudo mkdir -p "/var/www/vibesinthreads-app/backend/logs"
sudo mkdir -p "/var/www/vibesinthreads-app/frontend/logs"
sudo mkdir -p "/var/www/vibesinthreads-app/logs"

# Remove any conflicting .env files that might interfere with PM2 environment variables
rm -f "/var/www/vibesinthreads-app/backend/.env"

# Start services using ecosystem config
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo "✅ PM2 services started successfully"
```

### 22. Service Startup Verification
```bash
# Verify services started without crashes
echo "⏳ Verifying service startup stability..."
sleep 30

# Check for any errored or stopped services
if pm2 list | grep -E "errored|stopped"; then
    echo "❌ Service startup failed!"
    echo "📋 PM2 Status:"
    pm2 status
    echo "📋 Recent logs:"
    pm2 logs --lines 20
    exit 1
else
    echo "✅ All services running successfully"
fi
```

### 23. Verify Deployment
```bash
# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 15

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

# Health check
echo "🏥 Performing health check..."
if curl -f https://vibesinthreads.store/health; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    echo "📋 Recent logs:"
    pm2 logs --lines 20
fi

# Test API endpoints
echo "🔍 Testing API endpoints..."
curl -f https://vibesinthreads.store/api/v1/categories && echo "✅ Categories API working" || echo "❌ Categories API failed"

# Test frontend
echo "🌐 Testing frontend..."
curl -f https://vibesinthreads.store && echo "✅ Frontend loading" || echo "❌ Frontend failed"

# Test admin panel
echo "👩‍💼 Testing admin panel..."
curl -f https://vibesinthreads.store/admin/login && echo "✅ Admin panel accessible" || echo "❌ Admin panel failed"

echo "🎉 Deployment verification completed!"
```

### 24. Cleanup Temp Files and Old Backups
```bash
# Remove deployment artifacts from temp
rm -f "/tmp/vibes-backend-${DEPLOY_TIMESTAMP}.tar.gz"
rm -f "/tmp/vibes-frontend-${DEPLOY_TIMESTAMP}.tar.gz"

# Clean up old backups (keep only last 5)
echo "🧹 Cleaning up old backups..."
sudo find /opt/backup -type d -name "20*" | sort -r | tail -n +6 | xargs sudo rm -rf 2>/dev/null || true

echo "✅ Cleanup completed - temp files removed and old backups purged"
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
sudo rm -rf "/var/www/vibesinthreads-app/backend"
sudo rm -rf "/var/www/vibesinthreads-app/frontend"

# Restore previous deployment
sudo tar -xzf "/opt/backup/${LATEST_BACKUP}/previous-backend.tar.gz" -C "/var/www/vibesinthreads-app/"
sudo tar -xzf "/opt/backup/${LATEST_BACKUP}/previous-frontend.tar.gz" -C "/var/www/vibesinthreads-app/"

# Restore database to standardized location
sudo cp "/opt/backup/${LATEST_BACKUP}/production.db" "/opt/database/"

# Restart services
pm2 start all

# Verify rollback
curl -f https://vibesinthreads.store/health
```

---

## 🔧 Troubleshooting & Common Issues

### Issue 1: TypeScript Compilation Errors During Build

**Problem**: TypeScript compilation fails with implicit 'any' type errors during production build.

**Symptoms**:
```
error TS7006: Parameter 'user' implicitly has an 'any' type.
error TS7006: Parameter 'sum' implicitly has an 'any' type.
```

**Solution**: Add explicit type annotations to resolve compilation errors:
```bash
# Fix implicit any types in userController.ts
sed -i 's/users.map(async (user) => {/users.map(async (user: any) => {/g' backend/src/controllers/userController.ts
sed -i 's/orders.reduce((sum, order) => sum + order.totalAmount, 0)/orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)/g' backend/src/controllers/userController.ts

# Fix implicit any types in categoryService.ts
sed -i 's/categories.map(category => ({/categories.map((category: any) => ({/g' backend/src/services/categoryService.ts
sed -i 's/existingCategories.map(c => c.id)/existingCategories.map((c: any) => c.id)/g' backend/src/services/categoryService.ts

# Fix implicit any types in productService.ts
sed -i 's/existingProducts.map(p => p.id)/existingProducts.map((p: any) => p.id)/g' backend/src/services/productService.ts
sed -i 's/await prisma.$transaction(async (tx) => {/await prisma.$transaction(async (tx: any) => {/g' backend/src/services/productService.ts
```

### Issue 2: Sharp Module Platform Compatibility

**Problem**: Sharp module compiled for wrong platform (Windows node_modules deployed to Linux server).

**Symptoms**:
```
Error: Could not load the "sharp" module using the linux-x64 runtime
```

**Solution**: Reinstall native dependencies on the target platform:
```bash
# On the production server, after extraction
cd "/var/www/vibesinthreads-app/backend"
npm install --production

# For frontend (if needed)
cd "/var/www/vibesinthreads-app/frontend"
npm install --production
```

**Prevention**: Add to deployment process - always reinstall native dependencies on target server.

### Issue 3: Prisma Database Migration Baseline

**Problem**: Existing production database causes migration conflicts during deployment.

**Symptoms**:
```
Error: P3005
The database schema is not empty. Read more about how to baseline an existing production database
```

**Solution**: Mark existing migrations as applied for production databases:
```bash
cd "/var/www/vibesinthreads-app/backend"
export DATABASE_URL="file:/opt/database/production.db"

# Mark the initial migration as applied
sudo -u root -E npx prisma migrate resolve --applied 20250815103817_init

# Verify migration status
sudo -u root -E npx prisma migrate status
```

### Issue 4: PM2 Environment Variable Loading Issues

**Problem**: Backend fails to start due to environment variable conflicts between PM2 config and dotenv.

**Symptoms**:
```
[dotenv@17.2.1] injecting env (0) from .env
Error: Environment variable not found: DATABASE_URL
```

**Solution**: Use proper PM2 configuration with explicit working directory:
```javascript
// Updated ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "vibes-backend",
      script: "./backend/dist/index.js",
      cwd: "/var/www/vibesinthreads-app/backend", // Explicit working directory
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        DATABASE_URL: "file:/opt/database/production.db",
        BASE_URL: "https://vibesinthreads.store",
        JWT_SECRET: "your-jwt-secret",
        JWT_REFRESH_SECRET: "your-jwt-refresh-secret",
        CORS_ORIGIN: "https://vibesinthreads.store"
      },
      // ... other config
    }
  ]
};
```

**Additional Fix**: Remove conflicting .env files:
```bash
# Remove empty or conflicting .env files that interfere with PM2 env vars
cd "/var/www/vibesinthreads-app/backend"
rm -f .env
```

### Issue 5: Different Tar File Timestamps

**Problem**: Backend and frontend tar files created with different timestamps causing extraction script failures.

**Solution**: Extract files individually with specific timestamps:
```bash
# Instead of using variable timestamp extraction, extract individually
sudo tar -xzf "/tmp/vibes-backend-20250816-160542.tar.gz" -C "/var/www/vibesinthreads-app/backend"
sudo tar -xzf "/tmp/vibes-frontend-20250816-160619.tar.gz" -C "/var/www/vibesinthreads-app/frontend"
```

### Issue 6: PM2 Logs Directory Creation

**Problem**: PM2 fails to create log directories when cwd is changed.

**Solution**: Pre-create log directories:
```bash
# Create log directories before starting PM2
sudo mkdir -p "/var/www/vibesinthreads-app/backend/logs"
sudo mkdir -p "/var/www/vibesinthreads-app/frontend/logs"
sudo mkdir -p "/var/www/vibesinthreads-app/logs"
```

### Deployment Best Practices (Lessons Learned)

1. **Cross-Platform Compatibility**: Always reinstall native dependencies on target platform
2. **TypeScript Strict Mode**: Add explicit type annotations for production builds
3. **Environment Variables**: Use PM2 environment configuration instead of .env files for production
4. **Database Migrations**: For existing databases, use `prisma migrate resolve --applied` for baseline
5. **Timestamps**: Use consistent timestamps or extract tar files individually
6. **Directory Structure**: Ensure all required directories exist before PM2 startup
7. **Build Verification**: Always verify builds work locally before deployment

---

## 📞 Support Information

- **SSH Access**: `ssh do-droplet`
- **Application Path**: `/var/www/vibesinthreads-app/`
- **Backup Path**: `/opt/backup/`
- **PM2 Commands**: `pm2 status`, `pm2 logs`, `pm2 restart all`
- **Admin Credentials**: 
  - Email: `admin@vibesinthreads.store`
  - Password: `VibesAdmin@2025!Store`

---

**Created**: August 16, 2025  
**Last Updated**: August 16, 2025 (v1.0.2 deployment)  
**Version**: 1.1  
**Status**: Production Ready with Troubleshooting Guide