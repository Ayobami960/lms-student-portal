import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

const isVercel = process.env.VERCEL === '1';

if (!(globalThis as any).window) {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  neonPool?: Pool;
};

const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing');
  }

  const connectionString = process.env.DATABASE_URL;
  
  let pool: Pool;
  if (globalForPrisma.neonPool) {
    pool = globalForPrisma.neonPool;
  } else {
    pool = new Pool({ 
      connectionString,
      max: isVercel ? 1 : 10 
    });
    
    if (!isVercel && process.env.NODE_ENV !== 'production') {
      globalForPrisma.neonPool = pool;
    }
  }

  // ✅ FIX: Assert 'pool as any' to cleanly bypass the rigid PoolConfig type mismatch
  const adapter = new PrismaNeon(pool as any); 
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production' || isVercel) {
  globalForPrisma.prisma = prisma;
}
