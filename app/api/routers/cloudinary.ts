import { z } from 'zod'
import { createRouter, adminMutation } from '../middleware'
import crypto from 'crypto'

const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'placeholder_api_key'
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'placeholder_api_secret'

export const cloudinaryRouter = createRouter({
  signUpload: adminMutation
    .input(z.object({ folder: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const timestamp = Math.round(new Date().getTime() / 1000)
        
        // Cloudinary requires signing parameters sorted alphabetically, joined by &, with secret appended
        const params = `folder=${input.folder}&timestamp=${timestamp}`
        const signature = crypto
          .createHash('sha1')
          .update(params + CLOUDINARY_API_SECRET)
          .digest('hex')

        return {
          success: true,
          signature,
          timestamp,
          apiKey: CLOUDINARY_API_KEY,
        }
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Failed to generate upload signature',
        }
      }
    })
})
