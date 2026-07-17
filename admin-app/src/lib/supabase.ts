import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  ingredients: string | null
  how_to_use: string | null
  rating: number | null
  category: string
  images: string[] | null
  display_order: number
  created_at: string
}

export type ProductVariant = {
  id: string
  product_id: string
  size_label: string
  price: number
  sku: string
  stock: number
  created_at: string
}

export type Order = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  address: string
  city: string
  state: string
  pincode: string
  landmark: string | null
  status: 'Pending' | 'Paid' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled'
  total: number
  delivery_charge: number
  payment_method: string
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  variant_id: string
  product_name: string
  variant_label: string
  quantity: number
  price: number
  status: 'Pending' | 'Shipped'
  created_at: string
}

export type Shipment = {
  id: string
  order_id: string
  waybill: string | null
  tracking_status: string | null
  tracking_url: string | null
  label_url: string | null
  shipped_at: string | null
  created_at: string
}
