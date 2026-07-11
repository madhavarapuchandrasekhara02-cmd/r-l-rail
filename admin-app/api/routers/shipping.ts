import { z } from 'zod'
import { createRouter, publicQuery } from '../trpc-middleware'
import { env } from '../../src/lib/env'

const DELHIVERY_API_TOKEN = env.DELHIVERY_API_TOKEN
const DELHIVERY_BASE = env.DELHIVERY_BASE_URL

export const shippingRouter = createRouter({
  trackShipment: publicQuery
    .input(z.object({ waybill: z.string() }))
    .query(async ({ input }) => {
      try {
        if (!DELHIVERY_API_TOKEN) {
          return {
            success: false,
            error: 'Delhivery API token is not configured. Live tracking is unavailable in development mode.'
          }
        }

        const res = await fetch(
          `${DELHIVERY_BASE}/api/v1/packages/json/?waybill=${input.waybill}`,
          {
            headers: {
              'Authorization': `Token ${DELHIVERY_API_TOKEN}`
            }
          }
        )
        const data = await res.json()
        
        const shipment = data?.ShipmentData?.[0]?.Shipment
        if (!shipment) {
          throw new Error('No active shipment records found in Delhivery database')
        }

        const scans = shipment.Scans || []
        const activity = scans.map((scan: any) => ({
          status: scan.ScanDetail?.Scan || 'Scanned',
          location: scan.ScanDetail?.ScannedLocation || 'In Transit',
          time: scan.ScanDetail?.ScanDateTime ? new Date(scan.ScanDetail.ScanDateTime).toLocaleString() : ''
        }))

        return {
          success: true,
          status: shipment.Status?.Status || 'Dispatched',
          activity: activity.length > 0 ? activity : [
            {
              status: shipment.Status?.Status || 'In Transit',
              location: shipment.Status?.Instructions || 'In Transit',
              time: shipment.Status?.StatusDateTime ? new Date(shipment.Status.StatusDateTime).toLocaleString() : ''
            }
          ]
        }
      } catch (err: any) {
        console.error('Delhivery trackShipment error:', err)
        return {
          success: false,
          error: err.message || 'Failed to fetch live tracking details'
        }
      }
    }),
})
