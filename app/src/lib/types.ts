export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  ingredients: string | null
  how_to_use: string | null
  rating: number | null
  category: 'hair-rituals' | 'face-rituals' | 'wellness-rituals' | 'baby-rituals'
  images: string[]
  gst_rate: number
  hsn_code: string
  display_order: number
  created_at: string
  updated_at: string | null
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
  invoice_number: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  address: string
  city: string
  state: string
  pincode: string
  landmark: string | null
  status: 'Pending' | 'Paid' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'RTO'
  total: number
  delivery_charge: number
  payment_method: string
  total_taxable: number
  total_cgst: number
  total_sgst: number
  total_igst: number
  total_gst: number
  created_at: string
  updated_at: string | null
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
  hsn_code: string
  gst_rate: number
  taxable_value: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
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
  courier_partner: string | null
  tracking_id: string | null
  pickup_status: string | null
  last_tracking_update: string | null
  pickup_request_id: string | null
  pickup_scheduled_time: string | null
}

export type ShipmentBatch = {
  id: string
  order_ids: string[]
  created_at: string
}

export type ShipmentTrackingEvent = {
  id: string
  shipment_id: string | null
  status: string
  location: string | null
  description: string | null
  event_time: string
  created_at: string
}
