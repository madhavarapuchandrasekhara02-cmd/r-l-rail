import { z } from 'zod'
import { createRouter, adminQuery, adminMutation } from '../trpc-middleware'
import { supabaseAdmin } from '../lib/supabase-admin'

export const productRouter = createRouter({
  list: adminQuery
    .query(async () => {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*, product_variants(*)')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
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
      const productData = {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        ingredients: input.ingredients || null,
        how_to_use: input.how_to_use || null,
        rating: input.rating,
        category: input.category,
        images: input.images,
        gst_rate: input.gst_rate,
        hsn_code: input.hsn_code,
        display_order: input.display_order,
      }

      if (input.id) {
        const { data, error } = await supabaseAdmin
          .from('products')
          .update(productData)
          .eq('id', input.id)
          .select('id')
          .single()

        if (error) throw error
        return data
      } else {
        const { data, error } = await supabaseAdmin
          .from('products')
          .insert([productData])
          .select('id')
          .single()

        if (error) throw error
        return data
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
      const variantData = {
        product_id: input.productId,
        size_label: input.sizeLabel,
        price: input.price,
        sku: input.sku,
        stock: input.stock,
      }

      if (input.id) {
        const { error } = await supabaseAdmin
          .from('product_variants')
          .update(variantData)
          .eq('id', input.id)

        if (error) throw error
      } else {
        const { error } = await supabaseAdmin
          .from('product_variants')
          .insert([variantData])

        if (error) throw error
      }

      return { success: true }
    }),

  delete: adminMutation
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      // Cascade delete is handled by database constraint, but we explicitly drop variants first just in case
      const { error: variantError } = await supabaseAdmin
        .from('product_variants')
        .delete()
        .eq('product_id', input.id)

      if (variantError) throw variantError

      const { error: productError } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', input.id)

      if (productError) throw productError
      return { success: true }
    }),

  deleteVariant: adminMutation
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin
        .from('product_variants')
        .delete()
        .eq('id', input.id)

      if (error) throw error
      return { success: true }
    }),

  getNextSku: adminMutation
    .input(z.object({ prefix: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabaseAdmin.rpc('get_next_sku', { prefix: input.prefix })
      if (error) throw error
      return data as string
    })
})
