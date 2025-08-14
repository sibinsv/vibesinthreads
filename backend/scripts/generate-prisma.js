const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isPrismaClientExists() {
  const clientPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
  const indexPath = path.join(clientPath, 'index.js');
  return fs.existsSync(indexPath);
}

async function generatePrismaWithRetry(maxRetries = 3) {
  // Check if client already exists and is working
  if (isPrismaClientExists()) {
    console.log('✅ Prisma Client already exists, skipping generation');
    return;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Generating Prisma Client (attempt ${attempt}/${maxRetries})...`);
    
    try {
      await new Promise((resolve, reject) => {
        exec('npx prisma generate', { cwd: process.cwd() }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            console.log(stdout);
            if (stderr) console.error(stderr);
            resolve();
          }
        });
      });
      
      console.log('✅ Prisma Client generated successfully!');
      return;
      
    } catch (error) {
      if (error.message.includes('EPERM') && attempt < maxRetries) {
        console.log(`⚠️  Windows file lock detected. Waiting ${attempt * 2} seconds...`);
        await sleep(attempt * 2000); // Progressive delay: 2s, 4s, 6s
        continue;
      } else {
        console.error('❌ Failed to generate Prisma Client:', error.message);
        if (attempt === maxRetries) {
          console.log('⚠️  Continuing anyway - existing client may work...');
          process.exit(0); // Don't fail the entire process
        }
      }
    }
  }
}

generatePrismaWithRetry();