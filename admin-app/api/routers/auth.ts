import { z } from 'zod'
import { createRouter, publicQuery } from '../trpc-middleware'
import { db } from '../lib/db'
import { verifyPassword, signToken } from '../lib/auth'
import { env } from '../../src/lib/env'
import { TRPCError } from '@trpc/server'

// Parse admin emails from env (comma-separated, lowercased)
const ADMIN_EMAILS = (env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const emailLower = input.email.trim().toLowerCase()
        
        // 1. Fetch user from DB
        const result = await db.query(
          'SELECT id, email, password_hash FROM admin_users WHERE email = $1',
          [emailLower]
        )
        
        if (result.rows.length === 0) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          })
        }
        
        const user = result.rows[0]
        
        // 2. Verify password
        const isPasswordValid = await verifyPassword(input.password, user.password_hash)
        if (!isPasswordValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          })
        }
        
        // 3. Verify user is registered as admin in env
        if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(emailLower)) {
          console.warn(`[Security Alert] Non-authorized login attempt for email: ${emailLower}`)
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have admin access to this resource.',
          })
        }
        
        // 4. Sign JWT
        const token = signToken({
          userId: user.id,
          email: user.email,
        })
        
        return {
          success: true,
          token,
        }
      } catch (err: any) {
        if (err instanceof TRPCError) throw err
        console.error('[Auth Router] Login error:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Login failed',
        })
      }
    }),
})
