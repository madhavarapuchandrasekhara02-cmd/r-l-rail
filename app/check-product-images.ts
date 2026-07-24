import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  try {
    const queryStr = `
      SELECT p.*, COALESCE(
        json_agg(
          json_build_object(
            'id', pv.id,
            'product_id', pv.product_id,
            'size_label', pv.size_label,
            'price', pv.price,
            'sku', pv.sku,
            'stock', pv.stock,
            'created_at', pv.created_at
          ) ORDER BY pv.created_at ASC
        ) FILTER (WHERE pv.id IS NOT NULL),
        '[]'::json
      ) AS product_variants
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      GROUP BY p.id
      ORDER BY p.display_order ASC, p.created_at DESC
    `
    console.log('Running optimized query...')
    const res = await pool.query(queryStr)
    console.log('Query succeeded! Rows count:', res.rows.length)
    if (res.rows.length > 0) {
      console.log('Sample product variants structure:', JSON.stringify(res.rows[0].product_variants, null, 2))
    }
  } catch (err) {
    console.error('❌ Query failed:', err)
  } finally {
    await pool.end()
  }
}
run()
