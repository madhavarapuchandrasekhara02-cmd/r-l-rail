import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '../../../../../api/lib/supabase-admin'
import { env } from '../../../../lib/env'

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize webhook request using secret header token
    const token = req.headers.get('X-Delhivery-Token') || new URL(req.url).searchParams.get('token')

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

    // Check if the order is already in a terminal state (Delivered, Cancelled, Returned, RTO)
    const { data: orderData, error: orderFetchErr } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (orderFetchErr) {
      console.error(`[Delhivery Webhook] Failed to fetch order status for ID ${orderId}:`, orderFetchErr)
    } else if (orderData && ['delivered', 'cancelled', 'returned', 'rto'].includes(orderData.status?.toLowerCase())) {
      console.log(`[Delhivery Webhook] Order ${orderId} is already in terminal status '${orderData.status}'. Ignoring update to prevent out-of-order status override.`)
      return new NextResponse('Webhook ignored: Order is in terminal state', { status: 200 })
    }

    // 2. Update the shipment record with the latest status
    const { error: shipmentUpdateErr } = await supabaseAdmin
      .from('shipments')
      .update({ tracking_status: currentStatus })
      .eq('waybill', waybill)

    if (shipmentUpdateErr) {
      console.error(`[Delhivery Webhook] Failed to update shipment record:`, shipmentUpdateErr)
    }

    // 3. Map Delhivery status to allowed order status (Pending, Processing, Paid, Packed, Shipped, Delivered, Cancelled, Returned, RTO)
    const normalizedStatus = currentStatus.toLowerCase()
    let newOrderStatus: 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'RTO' | null = null

    if (normalizedStatus === 'delivered') {
      newOrderStatus = 'Delivered'
    } else if (normalizedStatus.includes('rto') || normalizedStatus.includes('returned to origin')) {
      newOrderStatus = 'RTO'
    } else if (normalizedStatus.includes('returned') || normalizedStatus.includes('undelivered')) {
      newOrderStatus = 'Returned'
    } else if (normalizedStatus.includes('cancelled')) {
      newOrderStatus = 'Cancelled'
    }

    if (newOrderStatus) {
      const { error: orderUpdateErr } = await supabaseAdmin
        .from('orders')
        .update({ status: newOrderStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        
      if (orderUpdateErr) {
        console.error(`[Delhivery Webhook] Failed to update order status:`, orderUpdateErr)
        return new NextResponse('Database error', { status: 500 })
      }
      
      console.log(`[Delhivery Webhook] SUCCESS! Order ${orderId} marked as ${newOrderStatus}.`)
    }

    // Always return 200 OK to acknowledge receipt, otherwise Delhivery will keep retrying
    return new NextResponse('Webhook processed successfully', { status: 200 })

  } catch (error: any) {
    console.error('[Delhivery Webhook] Exception:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
