import { z } from 'zod'
import { createRouter, adminQuery, adminMutation } from '../trpc-middleware'
import { db } from '../lib/db'

export const productRouter = createRouter({
  list: adminQuery
    .query(async () => {
      const { rows: products } = await db.query(`
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
        GROUP BY p.id
        ORDER BY p.display_order ASC, p.created_at DESC
      `)

      return products || []
    }),

  upsert: adminMutation
    .input(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(100),
        slug: z.string().trim().min(1).max(100),
        description: z.string().trim().max(1000).nullable().optional(),
        ingredients: z.string().trim().max(1000).nullable().optional(),
        how_to_use: z.string().trim().max(1000).nullable().optional(),
        rating: z.number().min(0).max(5).default(4.5),
        category: z.enum(['hair-rituals', 'face-rituals', 'wellness-rituals', 'baby-rituals']),
        images: z.array(z.string().url()).default([]),
        gst_rate: z.number().int().min(0).max(100).default(18),
        hsn_code: z.string().trim().default('33051090'),
        display_order: z.number().int().default(999),
      })
    )
    .mutation(async ({ input }) => {
      const productData = [
        input.name,
        input.slug,
        input.description || null,
        input.ingredients || null,
        input.how_to_use || null,
        input.rating,
        input.category,
        input.images,
        input.gst_rate,
        input.hsn_code,
        input.display_order,
      ]

      if (input.id) {
        const { rows } = await db.query(
          'UPDATE products SET name = $1, slug = $2, description = $3, ingredients = $4, how_to_use = $5, rating = $6, category = $7, images = $8, gst_rate = $9, hsn_code = $10, display_order = $11, updated_at = NOW() WHERE id = $12 RETURNING id',
          [...productData, input.id]
        )
        return rows[0]
      } else {
        const { rows } = await db.query(
          'INSERT INTO products (name, slug, description, ingredients, how_to_use, rating, category, images, gst_rate, hsn_code, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
          productData
        )
        return rows[0]
      }
    }),

  upsertVariant: adminMutation
    .input(
      z.object({
        id: z.string().uuid().optional(),
        productId: z.string().uuid(),
        sizeLabel: z.string().trim().min(1),
        price: z.number().int().min(0),
        sku: z.string().trim().min(1),
        stock: z.number().int().min(0).default(0),
      })
    )
    .mutation(async ({ input }) => {
      if (input.id) {
        await db.query(
          'UPDATE product_variants SET size_label = $1, price = $2, sku = $3, stock = $4 WHERE id = $5',
          [input.sizeLabel, input.price, input.sku, input.stock, input.id]
        )
      } else {
        await db.query(
          'INSERT INTO product_variants (product_id, size_label, price, sku, stock) VALUES ($1, $2, $3, $4, $5)',
          [input.productId, input.sizeLabel, input.price, input.sku, input.stock]
        )
      }

      return { success: true }
    }),

  delete: adminMutation
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      // Cascade delete: product_variants first, then product
      await db.query(
        'DELETE FROM product_variants WHERE product_id = $1',
        [input.id]
      )

      await db.query(
        'DELETE FROM products WHERE id = $1',
        [input.id]
      )

      return { success: true }
    }),

  deleteVariant: adminMutation
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.query(
        'DELETE FROM product_variants WHERE id = $1',
        [input.id]
      )
      return { success: true }
    }),

  getNextSku: adminMutation
    .input(z.object({ prefix: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const { rows } = await db.query('SELECT get_next_sku($1) as next_sku', [input.prefix])
        return rows[0].next_sku
      } catch (e) {
        // Fallback: search variants for SKU starting with prefix
        const { rows } = await db.query(
          "SELECT sku FROM product_variants WHERE sku LIKE $1 ORDER BY sku DESC LIMIT 1",
          [`${input.prefix}%`]
        )
        if (rows.length === 0) {
          return `${input.prefix}1001`
        }
        // Try to parse the trailing digits
        const lastSku = rows[0].sku
        const match = lastSku.match(/\d+$/)
        if (match) {
          const num = parseInt(match[0], 10)
          const nextNum = num + 1
          const prefixPart = lastSku.substring(0, lastSku.length - match[0].length)
          return `${prefixPart}${nextNum}`
        }
        return `${lastSku}-1`
      }
    })
})
