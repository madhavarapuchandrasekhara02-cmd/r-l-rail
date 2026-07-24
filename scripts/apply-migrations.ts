import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../app/.env') })
dotenv.config({ path: path.join(__dirname, '../admin-app/.env') })

async function applyMigrations() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set in environment or env files.')
    process.exit(1)
  }

  console.log('Connecting to database...')
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  })

  const sqlFiles = [
    'migration.sql',
    'create_order_transaction.sql',
    'save_shipments_and_update_status.sql',
    'fix-invoice-trigger.sql'
  ]

  try {
    for (const file of sqlFiles) {
      const filePath = path.join(__dirname, '..', file)
      console.log(`\nApplying: ${file}...`)
      if (!fs.existsSync(filePath)) {
        throw new Error(`SQL file not found at ${filePath}`)
      }
      const sqlContent = fs.readFileSync(filePath, 'utf-8')
      await pool.query(sqlContent)
      console.log(`✅ Successfully applied: ${file}`)
    }
    console.log('\n🎉 All database migrations applied successfully!')
  } catch (err) {
    console.error('❌ Error applying migrations:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

applyMigrations()
