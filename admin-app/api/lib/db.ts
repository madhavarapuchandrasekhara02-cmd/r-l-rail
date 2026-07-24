import { Pool } from 'pg'

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

function getPool(): Pool {
  if (!globalForDb.pool) {
    globalForDb.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 30000,
    })
    globalForDb.pool.on('error', (err) => {
      console.error('[DB Pool] Unexpected error on idle client:', err)
    })
  }
  return globalForDb.pool
}

export const db = {
  query: (text: string, params?: any[]) => getPool().query(text, params),
}
