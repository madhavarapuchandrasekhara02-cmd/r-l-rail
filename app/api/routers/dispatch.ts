import { z } from 'zod'
import { createRouter, adminMutation, adminQuery, publicQuery } from '../middleware'
import { supabaseAdmin } from '../lib/supabase-admin'

// Delhivery config
const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN || ''
const DELHIVERY_BASE = process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com'
const DELHIVERY_ORIGIN_PINCODE = process.env.DELHIVERY_ORIGIN_PINCODE || '530026'
const DELHIVERY_PICKUP_NAME = process.env.DELHIVERY_PICKUP_LOCATION_NAME || 'Gajuwaka'

const SELLER_NAME = process.env.SELLER_NAME || 'Roots and Leaves'
const SELLER_GSTIN = process.env.SELLER_GSTIN || ''
const SELLER_ADDRESS = process.env.SELLER_ADDRESS || ''
const SELLER_STATE = process.env.SELLER_STATE || 'Andhra Pradesh'
const RETURN_PHONE = process.env.RETURN_PHONE || ''

// Sanitize address fields: Delhivery rejects &, #, %, ;, \
function sanitizeForDelhivery(str: string): string {
  if (!str) return ''
  return str.replace(/[&#%;\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Smart weight parser & dimension mapping
function calculatePackageDetails(items: any[]) {
  let totalWeight = 0
  let fragile = false
  const descriptions: string[] = []

  for (const item of items) {
    const qty = item.quantity || 1
    const name = item.product_name || 'Ayurvedic Product'
    const variant = (item.variant_label || '').toLowerCase()

    let itemWeight = 250
    
    // Extract numerical weight/volume from variant label
    const weightMatch = variant.match(/(\d+)\s*(g|ml|kg)/)
    if (weightMatch) {
      const value = parseInt(weightMatch[1], 10)
      const unit = weightMatch[2]
      if (unit === 'kg') {
        itemWeight = value * 1000 + 100 // add 100g packing per kg
      } else {
        itemWeight = value + 50 // add 50g glass/plastic bottle weight
      }
    } else {
      if (variant.includes('combo') || variant.includes('kit')) {
        itemWeight = 800
      }
    }

    totalWeight += itemWeight * qty

    if (
      name.toLowerCase().includes('glass') ||
      name.toLowerCase().includes('liquid') ||
      name.toLowerCase().includes('oil') ||
      name.toLowerCase().includes('shampoo') ||
      name.toLowerCase().includes('rosewater')
    ) {
      fragile = true
    }

    descriptions.push(`${name} (${item.variant_label}) x${qty}`)
  }

  totalWeight += 50 // packing box tare weight

  let length = 15, width = 10, height = 5
  if (totalWeight > 1000) { length = 30; width = 20; height = 15 }
  else if (totalWeight > 500) { length = 20; width = 15; height = 10 }

  return { weight: totalWeight, length, width, height, fragile, description: descriptions.join(', ').substring(0, 250) }
}

export const dispatchRouter = createRouter({
  shipOrders: adminMutation
    .input(
      z.object({
        orderIds: z.array(z.string().uuid()).min(1).max(100),
        pickupLocation: z.string().trim().max(100).default('Gajuwaka'),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`[Dispatch] Starting shipment for ${input.orderIds.length} orders...`)

      // Guard: require real API credentials
      if (!DELHIVERY_API_TOKEN || DELHIVERY_API_TOKEN === 'your-delhivery-api-token') {
        return {
          success: false,
          packages: [],
          errors: [{ reason: 'Delhivery API token is not configured. Please add your DELHIVERY_API_TOKEN to the .env file. You can get your token from the Delhivery Partner Dashboard at https://partners.delhivery.com' }],
        }
      }

      const successfulPackages: any[] = []
      const errors: any[] = []
      const shipmentObjs: any[] = []
      const orderMap: Record<string, any> = {}

      try {
        // 1. Gather all order details
        for (const orderId of input.orderIds) {
          const { data: order, error: orderErr } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single()

          if (orderErr || !order) {
            errors.push({ orderId, reason: orderErr?.message || 'Order not found' })
            continue
          }

          if (order.status === 'Shipped' || order.status === 'Delivered') {
            errors.push({ orderId, orderNumber: order.order_number, reason: `Order already ${order.status}` })
            continue
          }

          // Check if shipment already exists for this order
          const { data: existingShipment } = await supabaseAdmin
            .from('shipments')
            .select('id, waybill')
            .eq('order_id', orderId)
            .maybeSingle()

          if (existingShipment?.waybill) {
            errors.push({ orderId, orderNumber: order.order_number, reason: `Already has waybill: ${existingShipment.waybill}` })
            continue
          }

          if (!order.address || !order.pincode) {
            errors.push({ orderId, orderNumber: order.order_number, reason: 'Address or Pincode is missing' })
            continue
          }

          if (order.pincode.length !== 6 || isNaN(Number(order.pincode))) {
            errors.push({ orderId, orderNumber: order.order_number, reason: `Invalid pincode '${order.pincode}'` })
            continue
          }

          const pkgDetails = calculatePackageDetails(order.order_items || [])

          const paymentMode = 'Pre-paid'

          shipmentObjs.push({
            name: sanitizeForDelhivery(order.customer_name),
            add: sanitizeForDelhivery(order.address),
            city: sanitizeForDelhivery(order.city),
            state: order.state,
            pin: order.pincode,
            country: 'India',
            phone: order.customer_phone,
            payment_mode: paymentMode,
            order: order.order_number,
            products_desc: sanitizeForDelhivery(pkgDetails.description),
            cod_amount: 0,
            total_amount: order.total,
            weight: (pkgDetails.weight / 1000).toFixed(2),
            shipment_length: String(pkgDetails.length),
            shipment_width: String(pkgDetails.width),
            shipment_height: String(pkgDetails.height),
            fragile_shipment: pkgDetails.fragile ? 'true' : 'false',
            seller_inv: order.invoice_number || order.order_number,
            seller_name: SELLER_NAME,
            seller_add: sanitizeForDelhivery(SELLER_ADDRESS),
            seller_gst_tin: SELLER_GSTIN,
            hsn_code: (order.order_items?.[0] as any)?.hsn_code || '33051090',
            return_name: SELLER_NAME,
            return_add: sanitizeForDelhivery(SELLER_ADDRESS),
            return_pin: DELHIVERY_ORIGIN_PINCODE,
            return_city: 'Visakhapatnam',
            return_state: SELLER_STATE,
            return_phone: RETURN_PHONE,
            address_type: 'home',
          })

          orderMap[order.order_number] = order
        }

        if (shipmentObjs.length === 0) {
          return { success: false, packages: [], errors }
        }

        // 2. Build Delhivery manifestation payload
        const manifestationPayload = {
          shipments: shipmentObjs,
          pickup_location: DELHIVERY_PICKUP_NAME
        }

        console.log('[Dispatch] Calling Delhivery create shipment API...')

        // 3. Call Delhivery API
        const res = await fetch(
          `${DELHIVERY_BASE}/api/cmu/create.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${DELHIVERY_API_TOKEN}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `format=json&data=${encodeURIComponent(JSON.stringify(manifestationPayload))}`,
          }
        )

        const delhiveryResponse = await res.json()
        console.log('[Dispatch] Delhivery Response:', JSON.stringify(delhiveryResponse, null, 2))

        // 4. Process response packages
        const successfulWaybills: string[] = []

        if (delhiveryResponse?.packages) {
          for (const pkg of delhiveryResponse.packages) {
            const correspondingOrder = orderMap[pkg.refnum]
            if (!correspondingOrder) {
              errors.push({ orderNumber: pkg.refnum, reason: 'Order not found in local map' })
              continue
            }

            if (pkg.status === 'Success') {
              const waybill = pkg.waybill
              successfulWaybills.push(waybill)

              successfulPackages.push({
                orderId: correspondingOrder.id,
                orderNumber: pkg.refnum,
                waybill,
                status: 'Success',
              })

              // Insert shipment record
              await supabaseAdmin
                .from('shipments')
                .upsert({
                  order_id: correspondingOrder.id,
                  waybill,
                  tracking_status: 'Manifested',
                  tracking_url: `https://www.delhivery.com/track/package/${waybill}`,
                  shipped_at: new Date().toISOString(),
                }, { onConflict: 'order_id' })

              // Update order status
              await supabaseAdmin
                .from('orders')
                .update({ status: 'Shipped', updated_at: new Date().toISOString() })
                .eq('id', correspondingOrder.id)

            } else {
              errors.push({
                orderId: correspondingOrder.id,
                orderNumber: pkg.refnum,
                reason: pkg.remarks || pkg.remark || 'Delhivery rejected this shipment',
              })
            }
          }
        } else if (delhiveryResponse?.rmk) {
          errors.push({ reason: `Delhivery API error: ${delhiveryResponse.rmk}` })
        }

        return {
          success: successfulPackages.length > 0,
          packages: successfulPackages,
          errors,
          waybills: successfulWaybills,
        }
      } catch (err: any) {
        console.error('[Dispatch] shipOrders error:', err)
        return {
          success: false,
          packages: [],
          errors: [...errors, { reason: err.message || 'System error during shipment creation' }],
          waybills: [],
        }
      }
    }),

  getPackslipUrl: adminMutation
    .input(z.object({ waybills: z.array(z.string().trim().max(50)).min(1).max(100) }))
    .mutation(async ({ input }) => {
      if (!DELHIVERY_API_TOKEN || DELHIVERY_API_TOKEN === 'your-delhivery-api-token') {
        return { success: false, error: 'Delhivery API token not configured' }
      }

      const url = `${DELHIVERY_BASE}/api/p/packing_slip?wbns=${input.waybills.join(',')}&pdf=true`
      return {
        success: true,
        url,
      }
    }),

  getWaybills: adminMutation
    .input(z.object({ orderIds: z.array(z.string().uuid()).max(100).optional() }))
    .mutation(async ({ input }) => {
      let query = supabaseAdmin.from('shipments').select('waybill').not('waybill', 'is', null)
      if (input.orderIds && input.orderIds.length > 0) {
        query = query.in('order_id', input.orderIds)
      } else {
        query = query.order('created_at', { ascending: false }).limit(20)
      }
      const { data } = await query
      return (data || []).map(s => s.waybill).filter(Boolean) as string[]
    }),

  schedulePickup: adminMutation
    .input(
      z.object({
        expectedPackageCount: z.number().min(1).max(10000),
        pickupDate: z.string().trim().max(50),
        pickupTime: z.string().trim().max(50),
        pickupLocation: z.string().trim().max(100).default('Gajuwaka'),
      })
    )
    .mutation(async ({ input }) => {
      console.log('[Dispatch] Scheduling pickup:', input)

      if (!DELHIVERY_API_TOKEN || DELHIVERY_API_TOKEN === 'your-delhivery-api-token') {
        return {
          success: false,
          error: 'Delhivery API token not configured. Add DELHIVERY_API_TOKEN to your .env file.',
        }
      }

      try {
        const res = await fetch(
          `${DELHIVERY_BASE}/fm/request/new/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${DELHIVERY_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pickup_time: input.pickupTime,
              pickup_date: input.pickupDate,
              pickup_location: input.pickupLocation,
              expected_package_count: input.expectedPackageCount,
            }),
          }
        )

        const pickupRes = await res.json()
        console.log('[Dispatch] Pickup response:', JSON.stringify(pickupRes, null, 2))

        return { success: true, data: pickupRes }
      } catch (err: any) {
        console.error('[Dispatch] schedulePickup error:', err)
        return { success: false, error: err.message || 'Failed to schedule pickup' }
      }
    }),
})
