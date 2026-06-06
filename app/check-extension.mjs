import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase.from('products').select('id').limit(1)
  console.log('Products check:', data, error)
  
  // Try to use the function directly via RPC if possible, or just insert
  const { data: uuid, error: uuidErr } = await supabase.rpc('test_uuid') 
  // Wait, I can't call functions that don't exist.
  
  // Let's just try to insert into a dummy table with UUID default.
  const { error: insErr } = await supabase.from('product_variants').insert({
    product_id: data[0].id,
    size_label: 'TEST',
    price: 1,
    sku: 'TEST-' + Date.now()
  })
  console.log('Insert test:', insErr)
}

check().catch(console.error)
