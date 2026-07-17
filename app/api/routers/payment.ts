import { z } from 'zod'
import { createRouter, publicQuery, publicMutation } from '../trpc-middleware'
import { supabaseAdmin } from '../lib/supabase-admin'
import crypto from 'crypto'

import { env } from '../../src/lib/env'

// Razorpay Config
const RAZORPAY_KEY_ID = env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET

async function createRazorpayOrder(amount: number, receiptId: string) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      amount: amount, // in paise
      currency: 'INR',
      receipt: receiptId
    })
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.description || 'Failed to create Razorpay order')
  }
  return data
}

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const generated = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(orderId + '|' + paymentId)
    .digest('hex')
  return generated === signature
}

export const paymentRouter = createRouter({
  initiate: publicMutation
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
          throw new Error('Razorpay credentials are not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env')
        }
        console.log(`[Razorpay initiate] Starting secure price calculation for Order ID: ${input.orderId}`)

        // 1. Fetch the order and nested items directly from Supabase
        const { data: dbOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', input.orderId)
          .single()

        if (orderErr || !dbOrder) {
          console.error('[Razorpay initiate] Error fetching order:', orderErr)
          throw new Error('Order not found in database')
        }

        if (dbOrder.status !== 'Pending') {
          console.warn(`[Razorpay initiate] Blocked: Order status is '${dbOrder.status}', expected 'Pending'. Order ID: ${input.orderId}`)
          throw new Error('Payment can only be initiated for orders in Pending status')
        }

        // 2. Recalculate the sum of items + delivery charge securely on backend
        let itemTotal = 0
        for (const item of dbOrder.order_items || []) {
          itemTotal += item.price * item.quantity
        }

        const deliveryCharge = dbOrder.delivery_charge || 0
        const calculatedTotal = itemTotal + deliveryCharge
        const amountInPaise = calculatedTotal * 100

        console.log('[Razorpay initiate] Calculated secure backend values:', {
          orderNumber: dbOrder.order_number,
          itemTotalINR: itemTotal,
          deliveryChargeINR: deliveryCharge,
          calculatedTotalINR: calculatedTotal,
          amountInPaise,
        })

        // 3. Print out exact payload being sent to Razorpay API
        const razorpayPayload = {
          amount: amountInPaise,
          currency: 'INR',
          receipt: dbOrder.id,
        }
        console.log('[Razorpay Order Creation API] Request Payload:', JSON.stringify(razorpayPayload, null, 2))

        const order = await createRazorpayOrder(amountInPaise, dbOrder.id)
        console.log('[Razorpay Order Creation API] Response Payload:', JSON.stringify(order, null, 2))

        // 4. Update the order total and the razorpay order reference in Supabase
        await supabaseAdmin
          .from('orders')
          .update({ 
            total: calculatedTotal,
            payment_method: `razorpay_order:${order.id}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', input.orderId)

        return {
          success: true,
          razorpayOrderId: order.id,
          amount: order.amount,
          currency: order.currency,
          key: RAZORPAY_KEY_ID,
        }
      } catch (error: any) {
        console.error('Razorpay initiation error:', error)
        return {
          success: false,
          error: error.message || 'Payment initiation failed',
        }
      }
    }),

  verifyPayment: publicMutation
    .input(
      z.object({
        orderId: z.string(),
        razorpayOrderId: z.string(),
        razorpayPaymentId: z.string(),
        razorpaySignature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log(`[Razorpay verifyPayment] Verifying signature for Order ID: ${input.orderId}, Payment ID: ${input.razorpayPaymentId}`)

        const isValid = verifyRazorpaySignature(
          input.razorpayOrderId,
          input.razorpayPaymentId,
          input.razorpaySignature
        )

        if (!isValid) {
          console.warn('[Razorpay verifyPayment] Cryptographic signature check failed!')
          return {
            success: false,
            error: 'HMAC signature verification failed. Transaction might be tampered.',
          }
        }

        // Concurrency Guard Check: Check if order status is already Paid/Shipped/Delivered to prevent double-writes under load
        const { data: dbOrder, error: fetchErr } = await supabaseAdmin
          .from('orders')
          .select('status, payment_method')
          .eq('id', input.orderId)
          .single()

        if (fetchErr) throw fetchErr

        if (dbOrder.status === 'Paid' || dbOrder.status === 'Shipped' || dbOrder.status === 'Delivered') {
          console.log(`[Razorpay verifyPayment] Order ${input.orderId} already in status '${dbOrder.status}'. Skipping redundant state update.`)
          return { success: true }
        }

        // Cryptographic Order Association Assert (Bypass Mitigation)
        if (dbOrder.payment_method !== `razorpay_order:${input.razorpayOrderId}`) {
          console.warn('[Razorpay verifyPayment] Order substitution attempt detected!')
          return {
            success: false,
            error: 'Transaction mismatch: payment details do not match the target order.'
          }
        }

        // Update order status to Paid
        const { error } = await supabaseAdmin
          .from('orders')
          .update({ 
            status: 'Paid', 
            payment_method: `razorpay:${input.razorpayPaymentId}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', input.orderId)

        if (error) throw error
        console.log(`[Razorpay verifyPayment] Order ${input.orderId} successfully transitioned to Paid status.`)

        return { success: true }
      } catch (error: any) {
        console.error('Razorpay verification error:', error)
        return {
          success: false,
          error: error.message || 'Payment verification failed',
        }
      }
    }),
})
