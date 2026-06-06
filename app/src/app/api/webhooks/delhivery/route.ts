import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../api/lib/supabase-admin'

const APP_SECRET = process.env.APP_SECRET || 'your-app-secret'

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token') || req.headers.get('Authorization')
    
    // Verify token to prevent unauthorized status injections
    if (token !== APP_SECRET && token !== `Bearer ${APP_SECRET}`) {
      console.warn('[Delhivery Webhook] Unauthorized access attempt blocked')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json()
    console.log('[Delhivery Webhook] Received tracking update:', JSON.stringify(payload))

    // Expecting standard Delhivery webhook format: { waybill: "...", status: "...", location: "..." }
    const waybill = payload.waybill || payload.awb
    const trackingStatus = payload.status || payload.state

    if (waybill) {
      // Find shipment by waybill
      const { data: shipment, error: shipErr } = await supabaseAdmin
        .from('shipments')
        .select('id, order_id')
        .eq('waybill', waybill)
        .single()

      if (shipErr || !shipment) {
        console.warn(`[Delhivery Webhook] Shipment with waybill ${waybill} not found`)
      } else {
        // Map trackingStatus to order status: Shipped, Delivered, etc.
        let orderStatus = 'Shipped'
        if (trackingStatus?.toLowerCase() === 'delivered' || trackingStatus?.toLowerCase() === 'dl') {
          orderStatus = 'Delivered'
        }

        // Update shipment tracking state
        await supabaseAdmin
          .from('shipments')
          .update({
            tracking_status: trackingStatus,
            shipped_at: orderStatus === 'Shipped' ? new Date().toISOString() : undefined,
          })
          .eq('id', shipment.id)

        // Update order status
        await supabaseAdmin
          .from('orders')
          .update({
            status: orderStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', shipment.order_id)

        console.log(`[Delhivery Webhook] Successfully updated Waybill ${waybill} to ${trackingStatus} and Order to ${orderStatus}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Delhivery Webhook] Exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
