import { PrismaClient } from '@prisma/client';

declare global {
  var __PRISMA__: PrismaClient;
  
  namespace NodeJS {
    interface Global {
      __PRISMA__: PrismaClient;
    }
  }
}