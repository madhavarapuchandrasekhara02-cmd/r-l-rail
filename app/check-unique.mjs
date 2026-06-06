import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'product_variants' })
  // Wait, get_table_info might not exist.
  // Let's try to fetch one row and see the structure or just try a raw query via a temporary RPC.
  
  // Actually, I'll just try to insert a DUPLICATE SKU for a DIFFERENT product and see if it fails.
  console.log('Testing global SKU uniqueness...')
  
  const { data: p1 } = await supabase.from('products').insert({ name: 'P1', slug: 'p1-' + Date.now(), category: 'Naturals' }).select('id').single()
  const { data: p2 } = await supabase.from('products').insert({ name: 'P2', slug: 'p2-' + Date.now(), category: 'Naturals' }).select('id').single()
  
  const sku = 'DUP-' + Date.now()
  
  const { error: e1 } = await supabase.from('product_variants').insert({ product_id: p1.id, size_label: 'S1', price: 10, sku })
  console.log('Insert 1:', e1)
  
  const { error: e2 } = await supabase.from('product_variants').insert({ product_id: p2.id, size_label: 'S1', price: 10, sku })
  console.log('Insert 2 (same SKU, different product):', e2)
}

check().catch(console.error)
