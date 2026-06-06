import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function audit() {
  console.log('Auditing SKUs...')
  
  const { data, error } = await supabase
    .from('product_variants')
    .select('sku, size_label, product_id')
    .order('sku')

  if (error) {
    console.error('Fetch error:', error)
    return
  }

  console.log(`Found ${data.length} variants.`)
  console.log('Last 10 SKUs:', data.slice(-10).map(v => v.sku))
  
  const { data: seqVal, error: seqErr } = await supabase.rpc('get_next_sku', { prefix: 'AUDIT' })
  console.log('Next generated SKU would be:', seqVal)
}

audit().catch(console.error)
