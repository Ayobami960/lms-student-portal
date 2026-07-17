import 'dotenv/config';
// ✅ IMPORT FROM THE STANDARD GLOBAL PACKAGES ROUTE NOW
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

const isVercel = process.env.VERCEL === '1';

if (!(globalThis as any).window) {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing');
  }

  let connectionString = process.env.DATABASE_URL;
  if (isVercel && !connectionString.includes('connection_limit')) {
    connectionString += connectionString.includes('?') ? '&connection_limit=1' : '?connection_limit=1';
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production' || isVercel) {
  globalForPrisma.prisma = prisma;
}
