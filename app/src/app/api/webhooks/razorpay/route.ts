import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import crypto from 'crypto'
import { db } from '../../../../../api/lib/db'

import { env } from '../../../../lib/env'

const RAZORPAY_WEBHOOK_SECRET = env.RAZORPAY_WEBHOOK_SECRET

export async function POST(req: Request) {
  try {
    const bodyText = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''

    // Verify webhook signature securely
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(bodyText)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.warn('[Razorpay Webhook] Invalid webhook signature detected')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const payload = JSON.parse(bodyText)
    const event = payload.event
    console.log(`[Razorpay Webhook] Received event: ${event}`)

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload.payload.payment?.entity
      const razorpayOrderId = payment?.order_id

      if (razorpayOrderId) {
        // Find order associated with this Razorpay Order ID using exact indexed match
        const findResult = await db.query(
          'SELECT id, status, total FROM orders WHERE payment_method = $1',
          [`razorpay_order:${razorpayOrderId}`]
        )

        if (findResult.rows.length === 0) {
          console.warn(`[Razorpay Webhook] Order with Razorpay Order ID ${razorpayOrderId} not found`)
        } else {
          const order = findResult.rows[0]
          
          if (order.status === 'Paid' || order.status === 'Shipped' || order.status === 'Delivered') {
            console.log(`[Razorpay Webhook] Order ${order.id} is already processed. Ignoring duplicate webhook to save resources.`)
            return NextResponse.json({ success: true, message: 'Already processed' })
          } else {
            // Verify payment amount matches database total
            if (payment && typeof payment.amount === 'number') {
              const expectedAmountPaise = Math.round(order.total * 100)
              if (payment.amount !== expectedAmountPaise) {
                console.warn(`[Razorpay Webhook] Amount mismatch! Captured: ${payment.amount}, Expected: ${expectedAmountPaise}`)
                return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
              }
            }

            // Transition order status to Paid securely (Atomic status lock check)
            const updateResult = await db.query(
              "UPDATE orders SET status = $1, payment_method = $2, updated_at = $3 WHERE id = $4 AND status = 'Pending'",
              ['Paid', `razorpay:${payment.id}`, new Date().toISOString(), order.id]
            )

            if (updateResult.rowCount === 0) {
              console.log(`[Razorpay Webhook] Order ${order.id} was already marked as Paid. Skipping duplicate webhook side-effects.`)
              return NextResponse.json({ success: true, message: 'Already processed' })
            }

            console.log(`[Razorpay Webhook] Successfully marked Order ${order.id} as Paid via Webhook`)
          }
        }
      }
    }
    if (event === 'payment.failed') {
      const payment = payload.payload.payment?.entity
      const razorpayOrderId = payment?.order_id
      if (razorpayOrderId) {
        console.log(`[Razorpay Webhook] Payment failed for order ${razorpayOrderId}. Reason: ${payment?.error_description || 'Unknown'}. Order remains Pending for retry.`)
      }
      return NextResponse.json({ success: true, message: 'Failure logged' })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Razorpay Webhook] Exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
