import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import crypto from 'crypto'
import { supabaseAdmin } from '../../../../../api/lib/supabase-admin'

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
        // Find order associated with this Razorpay Order ID
        const { data: order, error: findErr } = await supabaseAdmin
          .from('orders')
          .select('id, status, total')
          .like('payment_method', `%${razorpayOrderId}%`)
          .single()

        if (findErr || !order) {
          console.warn(`[Razorpay Webhook] Order with Razorpay Order ID ${razorpayOrderId} not found`)
        } else if (order.status === 'Paid' || order.status === 'Shipped' || order.status === 'Delivered') {
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

          // Transition order status to Paid securely
          const { error: updateErr } = await supabaseAdmin
            .from('orders')
            .update({
              status: 'Paid',
              payment_method: `razorpay:${payment.id}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)

          if (updateErr) throw updateErr
          console.log(`[Razorpay Webhook] Successfully marked Order ${order.id} as Paid via Webhook`)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Razorpay Webhook] Exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
