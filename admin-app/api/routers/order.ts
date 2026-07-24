import { z } from 'zod'
import { createRouter, adminQuery, adminMutation } from '../trpc-middleware'
import { db } from '../lib/db'

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

// Helper: Given an array of orders, batch-fetch their order_items and shipments
// in exactly 2 queries (instead of 2N), then attach them in memory.
async function attachOrderRelations(orders: any[]): Promise<any[]> {
  if (orders.length === 0) return orders

  const orderIds = orders.map(o => o.id)

  const [itemsResult, shipmentsResult] = await Promise.all([
    db.query('SELECT * FROM order_items WHERE order_id = ANY($1)', [orderIds]),
    db.query('SELECT * FROM shipments WHERE order_id = ANY($1)', [orderIds]),
  ])

  // Group by order_id in memory
  const itemsByOrderId: Record<string, any[]> = {}
  for (const item of itemsResult.rows) {
    if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = []
    itemsByOrderId[item.order_id].push(item)
  }

  const shipmentsByOrderId: Record<string, any[]> = {}
  for (const shipment of shipmentsResult.rows) {
    if (!shipmentsByOrderId[shipment.order_id]) shipmentsByOrderId[shipment.order_id] = []
    shipmentsByOrderId[shipment.order_id].push(shipment)
  }

  return orders.map(order => ({
    ...order,
    order_items: itemsByOrderId[order.id] || [],
    shipments: shipmentsByOrderId[order.id] || [],
  }))
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

        let ordersResult;
        if (phone10.length === 10) {
          const phoneFormats = [
            phone10,
            `+91${phone10}`,
            `91${phone10}`,
            `0${phone10}`
          ]
          ordersResult = await db.query(
            'SELECT * FROM orders WHERE order_number = $1 OR customer_phone = ANY($2) ORDER BY created_at DESC',
            [cleanQuery, phoneFormats]
          )
        } else {
          ordersResult = await db.query(
            'SELECT * FROM orders WHERE order_number = $1 OR customer_phone = $2 ORDER BY created_at DESC',
            [cleanQuery, cleanQuery]
          )
        }

        // Batch-fetch related data in 2 queries instead of 2N
        const orders = await attachOrderRelations(ordersResult.rows)

        return { orders, success: true }
      } catch (err: any) {
        return { error: err.message || 'Tracking failed', success: false }
      }
    }),

  list: adminQuery
    .input(
      z.object({
        status: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      try {
        let queryStr = 'SELECT * FROM orders'
        let countStr = 'SELECT COUNT(*) FROM orders'
        const params: any[] = []
        const whereClauses: string[] = []

        if (input?.status) {
          params.push(input.status)
          whereClauses.push(`status = $${params.length}`)
        }

        if (input?.startDate) {
          params.push(new Date(input.startDate).toISOString())
          whereClauses.push(`created_at >= $${params.length}`)
        }

        if (input?.endDate) {
          const end = new Date(input.endDate)
          end.setHours(23, 59, 59, 999)
          params.push(end.toISOString())
          whereClauses.push(`created_at <= $${params.length}`)
        }

        if (whereClauses.length > 0) {
          queryStr += ' WHERE ' + whereClauses.join(' AND ')
          countStr += ' WHERE ' + whereClauses.join(' AND ')
        }

        queryStr += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
        
        const limit = input?.limit || 50
        const offset = ((input?.page || 1) - 1) * limit
        const pageParams = [...params, limit, offset]

        // Run the main query and count query in parallel
        const [ordersResult, countResult] = await Promise.all([
          db.query(queryStr, pageParams),
          db.query(countStr, params),
        ])
        const total = parseInt(countResult.rows[0].count, 10)

        // Batch-fetch related data in 2 queries instead of 2N
        const orders = await attachOrderRelations(ordersResult.rows)

        return { orders, total }
      } catch (err: any) {
        return { orders: [], total: 0, error: err.message }
      }
    }),

  getById: adminQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const orderResult = await db.query(
          'SELECT * FROM orders WHERE id = $1',
          [input.id]
        )
        if (orderResult.rows.length === 0) throw new Error('Order not found')
        const order = orderResult.rows[0]

        // Fetch items and shipments in parallel
        const [{ rows: orderItems }, { rows: shipments }] = await Promise.all([
          db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]),
          db.query('SELECT * FROM shipments WHERE order_id = $1', [order.id]),
        ])

        order.order_items = orderItems
        order.shipments = shipments

        return { order }
      } catch (err: any) {
        return { error: err.message }
      }
    }),

  updateStatus: adminMutation
    .input(z.object({ id: z.string().uuid(), status: ORDER_STATUS_ENUM }))
    .mutation(async ({ input }) => {
      try {
        // 1. Fetch current status
        const orderResult = await db.query(
          'SELECT status FROM orders WHERE id = $1',
          [input.id]
        )

        if (orderResult.rows.length === 0) throw new Error('Order not found')
        const currentStatus = orderResult.rows[0].status
        const allowedTargets = VALID_TRANSITIONS[currentStatus] || []

        if (currentStatus !== input.status && !allowedTargets.includes(input.status)) {
          throw new Error(`Invalid status transition: "${currentStatus}" to "${input.status}"`)
        }

        const updateResult = await db.query(
          'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *',
          [input.status, new Date().toISOString(), input.id]
        )

        return { order: updateResult.rows[0] }
      } catch (err: any) {
        throw new Error(err.message || 'Failed to update order status')
      }
    }),

  getPackingList: adminQuery.query(async () => {
    try {
      const packingResult = await db.query(`
        SELECT oi.*, o.status as order_status 
        FROM order_items oi 
        JOIN orders o ON o.id = oi.order_id 
        WHERE o.status = 'Paid' AND oi.status = 'Pending'
      `)

      const aggregated = (packingResult.rows || []).reduce((acc: any, item: any) => {
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
      // Run both KPI queries in parallel
      const [salesResult, pendingResult] = await Promise.all([
        db.query("SELECT SUM(total) as total_sales FROM orders WHERE status IN ('Paid', 'Shipped', 'Delivered')"),
        db.query("SELECT COUNT(*) as pending_count FROM orders WHERE status = 'Pending'"),
      ])

      return {
        totalSales: parseInt(salesResult.rows[0].total_sales || '0', 10),
        pendingOrders: parseInt(pendingResult.rows[0].pending_count || '0', 10),
      }
    } catch {
      return { totalSales: 0, pendingOrders: 0 }
    }
  }),

  getAbandonedOrders: adminQuery
    .query(async () => {
      try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const ordersResult = await db.query(
          'SELECT * FROM orders WHERE status = $1 AND created_at < $2 ORDER BY created_at DESC',
          ['Pending', cutoff]
        )

        if (ordersResult.rows.length === 0) {
          return { success: true, orders: [] }
        }

        // Batch-fetch all order_items for abandoned orders in 1 query
        const orderIds = ordersResult.rows.map((o: any) => o.id)
        const { rows: allItems } = await db.query(
          'SELECT * FROM order_items WHERE order_id = ANY($1)',
          [orderIds]
        )

        // Group items by order_id in memory
        const itemsByOrderId: Record<string, any[]> = {}
        for (const item of allItems) {
          if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = []
          itemsByOrderId[item.order_id].push(item)
        }

        for (const order of ordersResult.rows) {
          order.order_items = itemsByOrderId[order.id] || []
        }

        return { success: true, orders: ordersResult.rows }
      } catch (err: any) {
        return { success: false, error: err.message, orders: [] }
      }
    }),

  delete: adminMutation
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        // 1. Delete order items first (due to foreign key constraint)
        await db.query(
          'DELETE FROM order_items WHERE order_id = $1',
          [input.id]
        )

        // 2. Delete shipments (due to foreign key constraint)
        await db.query(
          'DELETE FROM shipments WHERE order_id = $1',
          [input.id]
        )

        // 3. Delete order
        await db.query(
          'DELETE FROM orders WHERE id = $1',
          [input.id]
        )

        return { success: true }
      } catch (err: any) {
        throw new Error(err.message || 'Failed to delete order')
      }
    }),

  getDashboardData: adminQuery.query(async () => {
    try {
      // Run all 5 independent dashboard queries in parallel
      const [salesResult, pendingResult, totalResult, statusResult, recentResult] = await Promise.all([
        db.query("SELECT SUM(total) as total_sales FROM orders WHERE status IN ('Paid', 'Shipped', 'Delivered')"),
        db.query("SELECT COUNT(*) as pending_count FROM orders WHERE status = 'Pending'"),
        db.query("SELECT COUNT(*) as total_count FROM orders"),
        db.query("SELECT status, COUNT(*)::integer as count FROM orders GROUP BY status"),
        db.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5"),
      ])

      return {
        totalSales: parseInt(salesResult.rows[0].total_sales || '0', 10),
        pendingOrders: parseInt(pendingResult.rows[0].pending_count || '0', 10),
        totalOrders: parseInt(totalResult.rows[0].total_count || '0', 10),
        statusCounts: statusResult.rows || [],
        recentOrders: recentResult.rows || [],
      }
    } catch (err: any) {
      console.error('[Order Router] getDashboardData error:', err)
      throw new Error('Failed to fetch dashboard data')
    }
  }),

  getTrackerOrders: adminQuery.query(async () => {
    try {
      const { rows } = await db.query(
        "SELECT id, order_number, created_at, status, customer_name, total FROM orders WHERE status != 'Pending' ORDER BY created_at ASC"
      )
      return rows || []
    } catch (err: any) {
      console.error('[Order Router] getTrackerOrders error:', err)
      throw new Error('Failed to fetch tracker orders')
    }
  }),

  getAnalyticsData: adminQuery.query(async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      // Run both analytics queries in parallel
      const [ordersResult, topProductsResult] = await Promise.all([
        db.query("SELECT created_at, total, customer_phone FROM orders WHERE created_at >= $1", [thirtyDaysAgo]),
        db.query("SELECT * FROM get_top_products(5)"),
      ])

      return {
        orders: ordersResult.rows || [],
        topProducts: topProductsResult.rows || [],
      }
    } catch (err: any) {
      console.error('[Order Router] getAnalyticsData error:', err)
      throw new Error('Failed to fetch analytics data')
    }
  }),
})
