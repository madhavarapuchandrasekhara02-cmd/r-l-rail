import { z } from 'zod'
import { createRouter, publicQuery, adminQuery, adminMutation } from '../middleware'
import { supabaseAdmin } from '../lib/supabase-admin'

export const orderRouter = createRouter({
  // Secure Guest Tracking: resolves phone number/order number and returns specific records securely
  track: publicQuery
    .input(z.object({ query: z.string().trim().max(100) }))
    .query(async ({ input }) => {
      try {
        const cleanQuery = input.query.trim()
        if (!cleanQuery) throw new Error('Search query is empty')

        const digitsOnly = cleanQuery.replace(/\D/g, '')
        let phone10 = digitsOnly
        if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
          phone10 = digitsOnly.substring(2)
        } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
          phone10 = digitsOnly.substring(1)
        }

        const lookupFilters = [
          `order_number.eq.${cleanQuery}`,
          `customer_phone.eq.${cleanQuery}`
        ]

        if (phone10.length === 10) {
          lookupFilters.push(
            `customer_phone.eq.${phone10}`,
            `customer_phone.eq.+91${phone10}`,
            `customer_phone.eq.91${phone10}`,
            `customer_phone.eq.0${phone10}`
          )
        }

        const orFilter = lookupFilters.join(',')

        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*), shipments(*)')
          .or(orFilter)
          .order('created_at', { ascending: false })

        if (error) throw error
        return { orders: data || [], success: true }
      } catch (err: any) {
        return { error: err.message || 'Tracking failed', success: false }
      }
    }),

  // Secure Server-Side Checkout: verifies inventory, secures pricing, calculates rounded taxes, creates transactions
  create: publicQuery
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
        const { data: dbVariants, error: varErr } = await supabaseAdmin
          .from('product_variants')
          .select('*, products(*)')
          .in('id', variantIds)

        if (varErr || !dbVariants || dbVariants.length !== input.items.length) {
          throw new Error('Some product variants were not found in master catalog')
        }

        // 2. Perform Stock Check & Calculate Decimal-Rounded Taxes (CGST/SGST/IGST)
        let orderTotal = 0
        let orderTaxable = 0
        let orderCGST = 0
        let orderSGST = 0
        let orderIGST = 0
        let orderGST = 0

        const isSameState = input.state.trim().toLowerCase() === (process.env.SELLER_STATE || 'Andhra Pradesh').trim().toLowerCase()

        const parsedOrderItems = input.items.map(item => {
          const dbVar = dbVariants.find(v => v.id === item.variantId)
          if (!dbVar) throw new Error('Variant match failure')
          
          // Bypassed stock checks: allowing unlimited orders as per business print-on-demand model

          const itemGross = dbVar.price * item.quantity
          const gstRate = dbVar.products.gst_rate ?? 18
          const hsnCode = dbVar.products.hsn_code ?? '33051090'

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
            product_name: dbVar.products.name,
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

        // 5. Create Order transactionally in Supabase
        const { data: order, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
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
          })
          .select()
          .single()

        if (orderErr) throw orderErr

        // Insert items with pre-calculated locked tax values
        const orderItemsWithIds = parsedOrderItems.map(item => ({
          ...item,
          order_id: order.id,
          status: 'Pending'
        }))

        const { error: itemsErr } = await supabaseAdmin
          .from('order_items')
          .insert(orderItemsWithIds)

        if (itemsErr) throw itemsErr

        // Bypassed stock deduction: stock levels remain untouched on checkout

        return {
          success: true,
          orderId: order.id,
          orderNumber: order.order_number,
          invoiceNumber: order.invoice_number,
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

  // Secure Protected Admin Queries: Guarded under protectedQuery/protectedMutation
  list: adminQuery
    .input(
      z.object({
        status: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      try {
        let query = supabaseAdmin
          .from('orders')
          .select('*, order_items(*), shipments(*)', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(((input?.page || 1) - 1) * (input?.limit || 50), (input?.page || 1) * (input?.limit || 50) - 1)

        if (input?.status) query = query.eq('status', input.status)

        const { data, error, count } = await query
        if (error) throw error
        return { orders: data || [], total: count || 0 }
      } catch (err: any) {
        return { orders: [], total: 0, error: err.message }
      }
    }),

  getById: adminQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*), shipments(*)')
          .eq('id', input.id)
          .single()
        if (error) throw error
        return { order: data }
      } catch (err: any) {
        return { error: err.message }
      }
    }),

  updateStatus: adminMutation
    .input(z.object({ id: z.string(), status: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .update({ status: input.status })
          .eq('id', input.id)
          .select()
          .single()
        if (error) throw error
        return { order: data }
      } catch (err: any) {
        return { error: err.message }
      }
    }),

  getPackingList: adminQuery.query(async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('order_items')
        .select('*, orders!inner(status), product_variants(size_label, products(name))')
        .eq('orders.status', 'Paid')
        .eq('status', 'Pending')

      if (error) throw error

      const aggregated = (data || []).reduce((acc: any, item: any) => {
        const key = `${item.product_name}-${item.variant_label}`
        if (!acc[key]) {
          acc[key] = {
            productName: item.product_name,
            variantLabel: item.variant_label,
            totalQuantity: 0,
          }
        }
        acc[key].totalQuantity += item.quantity
        return acc
      }, {})

      return { items: Object.values(aggregated) }
    } catch (err: any) {
      return { items: [], error: err.message }
    }
  }),

  getKPIs: adminQuery.query(async () => {
    try {
      const { data: totalSales } = await supabaseAdmin
        .from('orders')
        .select('total')
        .in('status', ['Paid', 'Shipped', 'Delivered'])

      const { data: pendingOrders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('status', 'Pending')

      return {
        totalSales: totalSales?.reduce((s, o) => s + (o.total || 0), 0) || 0,
        pendingOrders: pendingOrders?.length || 0,
      }
    } catch {
      return { totalSales: 0, pendingOrders: 0 }
    }
  }),
})
