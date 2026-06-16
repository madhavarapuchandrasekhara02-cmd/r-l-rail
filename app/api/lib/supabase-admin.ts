import { createClient } from '@supabase/supabase-js'
import { env } from '../../src/lib/env'

export const supabaseAdmin = createClient(
  env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, 
  env.SUPABASE_SERVICE_KEY, 
  { auth: { autoRefreshToken: false, persistSession: false } }
)
