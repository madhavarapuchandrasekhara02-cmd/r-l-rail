import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env files
dotenv.config({ path: path.join(__dirname, '../app/.env') })
dotenv.config({ path: path.join(__dirname, '../admin-app/.env') })

async function seedAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]
  
  if (!email || !password) {
    console.error('Usage: npx tsx scripts/seed-admin.ts <email> <password>')
    process.exit(1)
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set in environment or env files.')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  })

  try {
    const hash = await bcrypt.hash(password, 12)
    await pool.query(
      'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash = $2, updated_at = NOW()',
      [email.trim().toLowerCase(), hash]
    )
    console.log(`\n✅ Admin user created/updated successfully: ${email}`)
  } catch (err) {
    console.error('❌ Error seeding admin:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seedAdmin()
