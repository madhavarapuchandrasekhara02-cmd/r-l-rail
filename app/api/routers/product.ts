import { z } from 'zod'
import { createRouter, publicQuery } from '../trpc-middleware'
import { db } from '../lib/db'

export const productRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      try {
        let queryStr = `
          SELECT p.*, COALESCE(
            json_agg(
              json_build_object(
                'id', pv.id,
                'product_id', pv.product_id,
                'size_label', pv.size_label,
                'price', pv.price,
                'sku', pv.sku,
                'stock', pv.stock,
                'created_at', pv.created_at
              ) ORDER BY pv.created_at ASC
            ) FILTER (WHERE pv.id IS NOT NULL),
            '[]'::json
          ) AS product_variants
          FROM products p
          LEFT JOIN product_variants pv ON p.id = pv.product_id
        `
        const params: any[] = []
        const whereClauses: string[] = []

        if (input?.category) {
          params.push(input.category)
          whereClauses.push(`p.category = $${params.length}`)
        }
        if (input?.search) {
          params.push(`%${input.search}%`)
          whereClauses.push(`p.name ILIKE $${params.length}`)
        }

        if (whereClauses.length > 0) {
          queryStr += ' WHERE ' + whereClauses.join(' AND ')
        }

        queryStr += ' GROUP BY p.id ORDER BY p.display_order ASC, p.created_at DESC'

        const { rows: products } = await db.query(queryStr, params)
        return products || []
      } catch (err: any) {
        console.error('[Storefront Product Router] list error:', err)
        return []
      }
    }),

  getCategoryCounts: publicQuery
    .query(async () => {
      try {
        const { rows } = await db.query(
          'SELECT category, COUNT(*)::integer as count FROM products GROUP BY category'
        )
        return rows || []
      } catch (err: any) {
        console.error('[Storefront Product Router] getCategoryCounts error:', err)
        return []
      }
    }),
})
