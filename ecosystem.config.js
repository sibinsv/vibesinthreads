module.exports = {
  apps: [
    {
      name: 'vibes-backend',
      script: './backend/dist/index.js',
      cwd: '/var/www/vibesinthreads-app',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'file:./prisma/prod.db',
        // NOTE: JWT secrets should be replaced with secure random strings during deployment
        // Generate using: openssl rand -hex 32
        JWT_SECRET: 'REPLACE_WITH_JWT_SECRET_DURING_DEPLOYMENT',
        JWT_REFRESH_SECRET: 'REPLACE_WITH_JWT_REFRESH_SECRET_DURING_DEPLOYMENT',
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