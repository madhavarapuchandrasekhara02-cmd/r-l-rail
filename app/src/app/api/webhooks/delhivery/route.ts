import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { db } from '../../../../../api/lib/db'
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
    const shipmentResult = await db.query(
      'SELECT order_id FROM shipments WHERE waybill = $1',
      [waybill]
    )
      
    if (shipmentResult.rows.length === 0) {
      console.error(`[Delhivery Webhook] Waybill ${waybill} not found in database.`)
      return new NextResponse('Waybill not found', { status: 404 })
    }

    const orderId = shipmentResult.rows[0].order_id

    // Check if the order is already in a terminal state (Delivered, Cancelled, Returned, RTO)
    const orderResult = await db.query(
      'SELECT status FROM orders WHERE id = $1',
      [orderId]
    )

    if (orderResult.rows.length === 0) {
      console.error(`[Delhivery Webhook] Order not found for ID ${orderId}`)
      return new NextResponse('Order not found', { status: 404 })
    }
    
    const orderData = orderResult.rows[0]

    if (orderData && ['delivered', 'cancelled', 'returned', 'rto'].includes(orderData.status?.toLowerCase())) {
      console.log(`[Delhivery Webhook] Order ${orderId} is already in terminal status '${orderData.status}'. Ignoring update to prevent out-of-order status override.`)
      return new NextResponse('Webhook ignored: Order is in terminal state', { status: 200 })
    }

    // 2. Update the shipment record with the latest status
    await db.query(
      'UPDATE shipments SET tracking_status = $1 WHERE waybill = $2',
      [currentStatus, waybill]
    )

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
      await db.query(
        'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3',
        [newOrderStatus, new Date().toISOString(), orderId]
      )
      
      console.log(`[Delhivery Webhook] SUCCESS! Order ${orderId} marked as ${newOrderStatus}.`)
    }

    // Always return 200 OK to acknowledge receipt, otherwise Delhivery will keep retrying
    return new NextResponse('Webhook processed successfully', { status: 200 })

  } catch (error: any) {
    console.error('[Delhivery Webhook] Exception:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
