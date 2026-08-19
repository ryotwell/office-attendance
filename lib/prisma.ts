import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL as string;
const pool = new Pool({ connectionString });
export const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  return new PrismaClient({
    // log: ['query', 'info', 'warn', 'error'],
    log: ['error'],
    adapter,
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;
export { prisma };

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
