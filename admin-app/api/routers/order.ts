import { z } from 'zod'
import { createRouter, adminQuery, adminMutation } from '../trpc-middleware'
import { supabaseAdmin } from '../lib/supabase-admin'

// Force Next.js recompile cache-bust

const ORDER_STATUS_ENUM = z.enum(['Pending', 'Paid', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'RTO'])

const VALID_TRANSITIONS: Record<string, string[]> = {
  'Pending': ['Paid', 'Cancelled'],
  'Paid': ['Packed', 'Cancelled'],
  'Packed': ['Shipped', 'Cancelled'],
  'Shipped': ['Delivered', 'Cancelled', 'Returned', 'RTO'],
  'Delivered': [],
  'Cancelled': [],
  'Returned': [],
  'RTO': [],
}

export const orderRouter = createRouter({
  track: adminQuery
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
    .input(z.object({ id: z.string().uuid(), status: ORDER_STATUS_ENUM }))
    .mutation(async ({ input }) => {
      try {
        // 1. Fetch current status
        const { data: currentOrder, error: fetchErr } = await supabaseAdmin
          .from('orders')
          .select('status')
          .eq('id', input.id)
          .single()

        if (fetchErr || !currentOrder) throw new Error('Order not found')

        const currentStatus = currentOrder.status
        const allowedTargets = VALID_TRANSITIONS[currentStatus] || []

        if (currentStatus !== input.status && !allowedTargets.includes(input.status)) {
          throw new Error(`Invalid status transition: "${currentStatus}" to "${input.status}"`)
        }

        const { data, error } = await supabaseAdmin
          .from('orders')
          .update({ status: input.status, updated_at: new Date().toISOString() })
          .eq('id', input.id)
          .select()
          .single()

        if (error) throw error
        return { order: data }
      } catch (err: any) {
        throw new Error(err.message || 'Failed to update order status')
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

  getAbandonedOrders: adminQuery
    .query(async () => {
      try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*)')
          .eq('status', 'Pending')
          .lt('created_at', cutoff)
          .order('created_at', { ascending: false })
        if (error) throw error
        return { success: true, orders: data || [] }
      } catch (err: any) {
        return { success: false, error: err.message, orders: [] }
      }
    }),

  delete: adminMutation
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        // 1. Delete order items first (due to foreign key constraint)
        await supabaseAdmin
          .from('order_items')
          .delete()
          .eq('order_id', input.id)

        // 2. Delete shipments (due to foreign key constraint)
        await supabaseAdmin
          .from('shipments')
          .delete()
          .eq('order_id', input.id)

        // 3. Delete order
        const { error } = await supabaseAdmin
          .from('orders')
          .delete()
          .eq('id', input.id)

        if (error) throw error
        return { success: true }
      } catch (err: any) {
        throw new Error(err.message || 'Failed to delete order')
      }
    }),
})
