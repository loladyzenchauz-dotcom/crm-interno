import { Pool } from "pg";

const globalForDb = globalThis as unknown as { __pgPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.__pgPool) {
    globalForDb.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return globalForDb.__pgPool;
}
