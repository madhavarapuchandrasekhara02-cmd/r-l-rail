import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY // Use service key to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('Testing Supabase Connection...')
  
  // 1. Check if get_next_sku exists
  const { data: skuData, error: skuError } = await supabase.rpc('get_next_sku', { prefix: 'TEST' })
  console.log('RPC get_next_sku:', skuData, skuError)

  // 2. Try to insert a dummy product
  const { data: prodData, error: prodError } = await supabase.from('products').insert({
    name: 'Test Product ' + Date.now(),
    slug: 'test-product-' + Date.now(),
    category: 'Foods',
  }).select('id').single()
  
  console.log('Insert Product:', prodData?.id, prodError)

  if (prodData?.id) {
    // 3. Try to insert variant
    const { data: varData, error: varError } = await supabase.from('product_variants').insert({
      product_id: prodData.id,
      size_label: '100g',
      price: 100,
      sku: skuData || 'TEST-1234',
      stock: 10
    })
    
    console.log('Insert Variant:', varData, varError)
  }
}

test().catch(console.error)
