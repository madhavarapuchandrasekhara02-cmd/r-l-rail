import { z } from 'zod'
import { createRouter, adminMutation, adminQuery, publicQuery } from '../trpc-middleware'
import { supabaseAdmin } from '../lib/supabase-admin'
import { getPackageDetails, isFragile } from '../../src/lib/weight'

import { env } from '../../src/lib/env'

// Delhivery config
const DELHIVERY_API_TOKEN = env.DELHIVERY_API_TOKEN
const DELHIVERY_BASE = env.DELHIVERY_BASE_URL
const DELHIVERY_ORIGIN_PINCODE = env.DELHIVERY_ORIGIN_PINCODE
const DELHIVERY_PICKUP_NAME = env.DELHIVERY_PICKUP_LOCATION_NAME
const DELHIVERY_CLIENT_NAME = env.DELHIVERY_CLIENT_NAME

const SELLER_NAME = env.SELLER_NAME
const SELLER_GSTIN = env.SELLER_GSTIN || ''
const SELLER_ADDRESS = env.SELLER_ADDRESS
const SELLER_STATE = env.SELLER_STATE
const RETURN_PHONE = env.RETURN_PHONE

// Sanitize address fields: Delhivery rejects &, #, %, ;, \
function sanitizeForDelhivery(str: string): string {
  if (!str) return ''
  return str.replace(/[&#%;\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Smart weight parser & dimension mapping
function calculatePackageDetails(items: any[]) {
  const pkg = getPackageDetails(items)
  return {
    weight: pkg.weight,
    length: pkg.length,
    width: pkg.width,
    height: pkg.height,
    fragile: pkg.fragile,
    description: pkg.description
  }
}

export const dispatchRouter = createRouter({
  generateLabels: adminMutation
    .input(
      z.object({
        orderIds: z.array(z.string().uuid()).min(1).max(100),
        pickupLocation: z.string().trim().max(100).default('BHEEMAVARAPU SURFACE'),
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
            client: DELHIVERY_CLIENT_NAME,
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
          pickup_location: { name: DELHIVERY_PICKUP_NAME }
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
        const dbShipments: any[] = []

        if (delhiveryResponse?.packages) {
          for (const pkg of delhiveryResponse.packages) {
            const correspondingOrder = orderMap[pkg.refnum]
            if (!correspondingOrder) {
              errors.push({ orderNumber: pkg.refnum, reason: 'Order not found in local map' })
              continue
            }

            if (pkg.status === 'Success') {
              const waybill = pkg.waybill
              dbShipments.push({
                order_id: correspondingOrder.id,
                waybill,
                tracking_url: `https://www.delhivery.com/track/package/${waybill}`,
                shipped_at: new Date().toISOString()
              })

              successfulWaybills.push(waybill)
              successfulPackages.push({
                orderId: correspondingOrder.id,
                orderNumber: pkg.refnum,
                waybill,
                status: 'Success',
              })
            } else {
              errors.push({
                orderId: correspondingOrder.id,
                orderNumber: pkg.refnum,
                reason: pkg.remarks || pkg.remark || 'Delhivery rejected this shipment',
              })
            }
          }

          // Atomically write shipments and update order statuses in a single transaction
          if (dbShipments.length > 0) {
            console.log(`[Dispatch] Writing ${dbShipments.length} shipments and updating orders atomically...`)
            const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc(
              'save_shipments_and_update_status',
              { p_shipments: dbShipments }
            )

            if (rpcErr || !rpcRes || (rpcRes as any).success === false) {
              const errMsg = rpcErr?.message || (rpcRes as any)?.error || 'Unknown transaction error'
              console.error('[Dispatch] save_shipments_and_update_status transactional error:', errMsg)
              
              // Move all successful packages back to errors array since they rolled back
              for (const pkg of dbShipments) {
                const correspondingOrder = orderMap[pkg.refnum] || { order_number: 'Unknown' }
                errors.push({
                  orderId: pkg.order_id,
                  orderNumber: correspondingOrder.order_number,
                  reason: `Database transaction rolled back: ${errMsg}`
                })
              }
              successfulPackages.length = 0
              successfulWaybills.length = 0
            } else {
              console.log(`[Dispatch] Database transaction completed. Updated ${(rpcRes as any).updated_count} records.`)
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
        console.error('[Dispatch] generateLabels error:', err)
        return {
          success: false,
          packages: [],
          errors: [...errors, { reason: err.message || 'System error during shipment creation' }],
          waybills: [],
        }
      }
    }),

  dispatchOrders: adminMutation
    .input(z.object({ orderIds: z.array(z.string().uuid()).min(1).max(500) }))
    .mutation(async ({ input }) => {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .update({ status: 'Shipped', updated_at: new Date().toISOString() })
          .in('id', input.orderIds)
          .eq('status', 'Packed') // Only transition Packed orders to Shipped
          .select('id, order_number')
        
        if (error) throw error
        return { success: true, updatedCount: data?.length || 0, orders: data }
      } catch (err: any) {
        console.error('[Dispatch] dispatchOrders error:', err)
        return { success: false, error: err.message || 'Failed to dispatch orders' }
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

  getRecentShipments: adminQuery.query(async () => {
    const { data } = await supabaseAdmin.from('shipments').select('*').order('created_at', { ascending: false }).limit(1000)
    return data || []
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
        pickupLocation: z.string().trim().max(100).default('BHEEMAVARAPU SURFACE'),
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
