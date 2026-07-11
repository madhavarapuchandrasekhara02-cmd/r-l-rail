import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '../../../../../api/lib/supabase-admin'
import { env } from '../../../../lib/env'

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize webhook request using secret query token
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token || token !== env.DELHIVERY_WEBHOOK_SECRET) {
      console.warn('[Delhivery Webhook] Unauthorized status update attempt blocked')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    console.log('[Delhivery Webhook] Received payload:', JSON.stringify(body))

    // Delhivery payload structure
    const shipmentData = body?.Shipment || body
    const statusObj = shipmentData?.Status
    const waybill = shipmentData?.Waybill || shipmentData?.AWB

    if (!waybill || !statusObj?.Status) {
      console.warn('[Delhivery Webhook] Invalid payload structure. Missing Waybill or Status.')
      return new NextResponse('Invalid payload', { status: 400 })
    }

    const currentStatus = statusObj.Status.trim()
    console.log(`[Delhivery Webhook] Waybill: ${waybill} is now ${currentStatus}`)

    // 1. First find the order ID associated with this waybill
    const { data: shipmentRecords, error: fetchErr } = await supabaseAdmin
      .from('shipments')
      .select('order_id')
      .eq('waybill', waybill)
      
    if (fetchErr || !shipmentRecords || shipmentRecords.length === 0) {
      console.error(`[Delhivery Webhook] Waybill ${waybill} not found in database.`)
      return new NextResponse('Waybill not found', { status: 404 })
    }

    const orderId = shipmentRecords[0].order_id

    // 2. Update the shipment record with the latest status
    const { error: shipmentUpdateErr } = await supabaseAdmin
      .from('shipments')
      .update({ tracking_status: currentStatus })
      .eq('waybill', waybill)

    if (shipmentUpdateErr) {
      console.error(`[Delhivery Webhook] Failed to update shipment record:`, shipmentUpdateErr)
    }

    // 3. If Delivered, update the main orders table to Delivered
    if (currentStatus.toLowerCase() === 'delivered') {
      const { error: orderUpdateErr } = await supabaseAdmin
        .from('orders')
        .update({ status: 'Delivered', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        
      if (orderUpdateErr) {
        console.error(`[Delhivery Webhook] Failed to update order status:`, orderUpdateErr)
        return new NextResponse('Database error', { status: 500 })
      }
      
      console.log(`[Delhivery Webhook] SUCCESS! Order ${orderId} marked as Delivered.`)
    }

    // Always return 200 OK to acknowledge receipt, otherwise Delhivery will keep retrying
    return new NextResponse('Webhook processed successfully', { status: 200 })

  } catch (error: any) {
    console.error('[Delhivery Webhook] Exception:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
