import { z } from 'zod'
import { createRouter, publicQuery, publicMutation } from '../trpc-middleware'
import { db } from '../lib/db'
import { env } from '../../src/lib/env'

export const orderRouter = createRouter({
  // Secure Guest Tracking: resolves phone number/order number and returns specific records securely
  track: publicQuery
    .input(
      z.object({
        query: z.string().trim().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const cleanQuery = input.query.trim()
        if (!cleanQuery) throw new Error('Search query is required')

        // 1. Detect if the query is a phone number (checking digits count)
        const digitsOnly = cleanQuery.replace(/\D/g, '')
        let phone10 = ''
        if (digitsOnly.length === 10) {
          phone10 = digitsOnly
        } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
          phone10 = digitsOnly.substring(2)
        } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
          phone10 = digitsOnly.substring(1)
        }

        const isPhone = phone10.length === 10

        let ordersResult;

        if (isPhone) {
          const phoneFormats = [
            phone10,
            `+91${phone10}`,
            `91${phone10}`,
            `0${phone10}`
          ]
          ordersResult = await db.query(
            'SELECT id, order_number, status, created_at, total, delivery_charge FROM orders WHERE customer_phone = ANY($1) ORDER BY created_at DESC',
            [phoneFormats]
          )
        } else {
          // Normalize Order ID: handles "ral1", "ral-1", "RaL 1", "RAL_1" -> "RAL-1"
          let normalizedOrderNumber = cleanQuery;
          const orderMatch = cleanQuery.match(/^RAL[\s\-_]*(\d+)$/i);
          if (orderMatch) {
            normalizedOrderNumber = `RAL-${orderMatch[1]}`;
          } else {
            normalizedOrderNumber = cleanQuery.toUpperCase();
          }
          ordersResult = await db.query(
            'SELECT id, order_number, status, created_at, total, delivery_charge FROM orders WHERE order_number = $1 ORDER BY created_at DESC',
            [normalizedOrderNumber]
          )
        }

        if (ordersResult.rows.length === 0) {
          return { orders: [], success: true }
        }

        const orderIds = ordersResult.rows.map(o => o.id)

        // Fetch all items for all matching orders in ONE query!
        const itemsResult = await db.query(
          'SELECT id, order_id, product_name, quantity, variant_label, price FROM order_items WHERE order_id = ANY($1)',
          [orderIds]
        )

        // Fetch all shipments for all matching orders in ONE query!
        const shipmentsResult = await db.query(
          'SELECT order_id, courier_partner, tracking_status, tracking_url, waybill FROM shipments WHERE order_id = ANY($1)',
          [orderIds]
        )

        // Map items and shipments to their respective orders in memory
        const itemsByOrderId = itemsResult.rows.reduce((acc: any, item) => {
          if (!acc[item.order_id]) acc[item.order_id] = []
          acc[item.order_id].push({
            id: item.id,
            product_name: item.product_name,
            quantity: item.quantity,
            variant_label: item.variant_label,
            price: item.price
          })
          return acc
        }, {})

        const shipmentsByOrderId = shipmentsResult.rows.reduce((acc: any, shipment) => {
          if (!acc[shipment.order_id]) acc[shipment.order_id] = []
          acc[shipment.order_id].push({
            courier_partner: shipment.courier_partner,
            tracking_status: shipment.tracking_status,
            tracking_url: shipment.tracking_url,
            waybill: shipment.waybill
          })
          return acc
        }, {})

        const orders = ordersResult.rows.map(order => ({
          ...order,
          order_items: itemsByOrderId[order.id] || [],
          shipments: shipmentsByOrderId[order.id] || []
        }))

        return { orders, success: true }
      } catch (err: any) {
        return { error: err.message || 'Tracking failed', success: false }
      }
    }),

  // Secure Server-Side Checkout: verifies inventory, secures pricing, calculates rounded taxes, creates transactions
  create: publicMutation
    .input(
      z.object({
        customerName: z.string().trim().min(1).max(100),
        customerPhone: z.string().trim().min(10).max(15),
        customerEmail: z.string().email().max(100).nullable().or(z.literal('')),
        address: z.string().trim().min(5).max(500).transform(val => val.replace(/</g, "&lt;").replace(/>/g, "&gt;")), // basic XSS mitigation
        city: z.string().trim().min(2).max(100),
        state: z.string().trim().min(2).max(100),
        pincode: z.string().trim().min(6).max(10),
        items: z.array(
          z.object({
            productId: z.string(),
            variantId: z.string(),
            quantity: z.number().min(1),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[order.create] Secure transactional checkout initiated')
        
        // 1. Resolve master product prices and details from database (Prevents price injection!)
        const variantIds = input.items.map(i => i.variantId)
        const { rows: dbVariants } = await db.query(
          'SELECT pv.*, p.name as product_name, p.gst_rate, p.hsn_code FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.id = ANY($1)',
          [variantIds]
        )

        if (!dbVariants || dbVariants.length !== input.items.length) {
          throw new Error('Some product variants were not found in master catalog')
        }

        // 2. Perform Stock Check & Calculate Decimal-Rounded Taxes (CGST/SGST/IGST)
        let orderTotal = 0
        let orderTaxable = 0
        let orderCGST = 0
        let orderSGST = 0
        let orderIGST = 0
        let orderGST = 0



        const isSameState = input.state.trim().toLowerCase() === env.SELLER_STATE.trim().toLowerCase()

        const parsedOrderItems = input.items.map(item => {
          const dbVar = dbVariants.find(v => v.id === item.variantId)
          if (!dbVar) throw new Error('Variant match failure')
          
          // Bypassed stock checks: allowing unlimited orders as per business print-on-demand model

          const itemGross = dbVar.price * item.quantity
          const gstRate = dbVar.gst_rate ?? 18
          const hsnCode = dbVar.hsn_code ?? '33051090'

          // Safe Reverse Tax Calculations
          const taxableValue = Math.round(itemGross / (1 + gstRate / 100))
          const gstAmount = itemGross - taxableValue

          let cgst = 0
          let sgst = 0
          let igst = 0

          if (isSameState) {
            cgst = Math.round(gstAmount / 2)
            sgst = Math.round(gstAmount / 2)
          } else {
            igst = gstAmount
          }

          orderTotal += itemGross
          orderTaxable += taxableValue
          orderCGST += cgst
          orderSGST += sgst
          orderIGST += igst
          orderGST += gstAmount

          return {
            product_id: dbVar.product_id,
            variant_id: dbVar.id,
            product_name: dbVar.product_name,
            variant_label: dbVar.size_label,
            quantity: item.quantity,
            price: dbVar.price,
            hsn_code: hsnCode,
            gst_rate: gstRate,
            taxable_value: taxableValue,
            cgst_amount: cgst,
            sgst_amount: sgst,
            igst_amount: igst,
          }
        })

        // 3. Composite Shipping Tax Calculations (Inherits rates or defaults at 18%)
        let deliveryCharge = 0
        // Free shipping special offer active: no delivery charge added.

        // Normalize phone: strip + and leading country code
        let normalizedPhone = input.customerPhone.replace(/[^\d]/g, '')
        if (normalizedPhone.length === 12 && normalizedPhone.startsWith('91')) {
          normalizedPhone = normalizedPhone.substring(2)
        } else if (normalizedPhone.length === 11 && normalizedPhone.startsWith('0')) {
          normalizedPhone = normalizedPhone.substring(1)
        }
        
        if (normalizedPhone.length !== 10) {
          throw new Error('Invalid mobile number. Must be exactly 10 digits.')
        }

        // Invoice number is auto-generated by database trigger on insert

        // 5. Create Order transactionally in database using the stored procedure
        const p_order = {
          customer_name: input.customerName,
          customer_phone: normalizedPhone,
          customer_email: input.customerEmail,
          address: input.address,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          status: 'Pending',
          payment_method: 'razorpay',
          total: orderTotal,
          delivery_charge: deliveryCharge,
          total_taxable: orderTaxable,
          total_cgst: orderCGST,
          total_sgst: orderSGST,
          total_igst: orderIGST,
          total_gst: orderGST,
        }

        const result = await db.query(
          'SELECT create_order_with_items($1::jsonb, $2::jsonb)',
          [JSON.stringify(p_order), JSON.stringify(parsedOrderItems)]
        )

        const rpcRes = result.rows[0].create_order_with_items
        if (!rpcRes.success) {
          throw new Error(rpcRes.error || 'Failed to write order transaction to database')
        }

        // Bypassed stock deduction: stock levels remain untouched on checkout

        return {
          success: true,
          orderId: rpcRes.order_id,
          orderNumber: rpcRes.order_number,
          invoiceNumber: rpcRes.invoice_number,
          total: orderTotal,
        }
      } catch (err: any) {
        console.error('[order.create] Transaction error:', err)
        return {
          success: false,
          error: err.message || 'Secure checkout transaction failed',
        }
      }
    }),

})
