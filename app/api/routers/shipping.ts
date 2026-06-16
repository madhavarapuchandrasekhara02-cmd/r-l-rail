import { z } from 'zod'
import { createRouter, publicQuery } from '../trpc-middleware'

import { env } from '../../src/lib/env'

// Delhivery config
const DELHIVERY_API_TOKEN = env.DELHIVERY_API_TOKEN
const DELHIVERY_BASE = env.DELHIVERY_BASE_URL
const DELHIVERY_ORIGIN_PINCODE = env.DELHIVERY_ORIGIN_PINCODE

export const shippingRouter = createRouter({
  checkPincode: publicQuery
    .input(z.object({ pincode: z.string() }))
    .query(async ({ input }) => {
      try {
        const checkUrl = `${DELHIVERY_BASE}/c/api/ajax/pin/?format=json&filter_codes=${input.pincode}`
        console.log('[Delhivery checkPincode] Requesting Serviceability URL:', checkUrl)

        if (!DELHIVERY_API_TOKEN || DELHIVERY_API_TOKEN === 'your-delhivery-api-token') {
          console.log('[Delhivery checkPincode] No token provided. Mocking serviceable response.')
          return { serviceable: true, estimatedDays: '5-7', note: 'Development mode - serviceability not verified' }
        }

        const res = await fetch(
          checkUrl,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${DELHIVERY_API_TOKEN}`
            }
          }
        )
        const data = await res.json()
        console.log('[Delhivery checkPincode] Received Response Payload:', JSON.stringify(data, null, 2))
        
        const postalCodeInfo = data?.delivery_codes?.[0]?.postal_code
        if (postalCodeInfo) {
          const serviceable = postalCodeInfo.is_serviceable === 'Y'
          return {
            serviceable,
            estimatedDays: serviceable ? '3-5' : 'Unserviceable'
          }
        }

        return { serviceable: true, estimatedDays: '3-5' }
      } catch (err) {
        console.error('Delhivery checkPincode error:', err)
        return { serviceable: false, error: 'Unable to verify serviceability. Please try again.' }
      }
    }),

  calculateCost: publicQuery
    .input(
      z.object({
        pincode: z.string(),
        weight: z.number(), // actual weight in grams
        length: z.number().optional(), // cm
        width: z.number().optional(), // cm
        height: z.number().optional(), // cm
      })
    )
    .query(async ({ input }) => {
      try {
        let chargeableWeight = input.weight
        let volumetricWeight = 0

        if (input.length && input.width && input.height) {
          // volumetric weight in kg = (length * width * height) / 5000
          // converted to grams = volumetric weight in kg * 1000
          volumetricWeight = ((input.length * input.width * input.height) / 5000) * 1000
          chargeableWeight = Math.max(input.weight, volumetricWeight)
        }

        const rateParams = {
          md: 'E',
          cgm: chargeableWeight,
          o_pin: DELHIVERY_ORIGIN_PINCODE,
          d_pin: input.pincode,
          ss: 'Delivered',
        }

        const rateUrl = `${DELHIVERY_BASE}/api/kinko/v1/invoice/charges/.json?md=${rateParams.md}&cgm=${rateParams.cgm}&o_pin=${rateParams.o_pin}&d_pin=${rateParams.d_pin}&ss=${rateParams.ss}`

        console.log('[Delhivery calculateCost] Constructed parameters:', {
          ...rateParams,
          actualWeightGrams: input.weight,
          volumetricWeightGrams: volumetricWeight,
          chargeableWeightGrams: chargeableWeight,
        })
        console.log('[Delhivery calculateCost] Request URL:', rateUrl)

        if (!DELHIVERY_API_TOKEN || DELHIVERY_API_TOKEN === 'your-delhivery-api-token') {
          // Fallback calculator for sandbox development
          const baseRate = 80
          const weightSlabCharge = Math.ceil(chargeableWeight / 500) * 15 // 15 INR per 500g slab
          let cost = baseRate + weightSlabCharge
          console.log('[Delhivery calculateCost Mocked Response] Calculated cost:', cost)
          return { charge: cost, freeThreshold: 1600 }
        }

        const res = await fetch(
          rateUrl,
          {
            headers: {
              'Authorization': `Token ${DELHIVERY_API_TOKEN}`
            }
          }
        )
        
        const data = await res.json()
        console.log('[Delhivery calculateCost] Received Response Payload:', JSON.stringify(data, null, 2))
        
        let rate = data?.[0]?.total_amount || 80

        return { charge: Math.ceil(rate), freeThreshold: 1600 }
      } catch (err) {
        console.error('Delhivery calculateCost error:', err)
        return { charge: 80, freeThreshold: 1600 }
      }
    }),

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
        
        const responseText = await res.text()
        let data
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          console.error('Delhivery tracking API returned invalid JSON:', responseText)
          throw new Error('Live tracking is temporarily unavailable or returned invalid data.')
        }
        
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

  resolvePincode: publicQuery
    .input(z.object({ pincode: z.string() }))
    .query(async ({ input }) => {
      try {
        console.log(`[Pincode Resolver] Requesting server-side resolution for pincode: ${input.pincode}`)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 4000) // 4 second timeout

        const res = await fetch(`https://api.postalpincode.in/pincode/${input.pincode}`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!res.ok) {
          throw new Error(`API responded with status code: ${res.status}`)
        }

        const data = await res.json()
        if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const office = data[0].PostOffice[0]
          return {
            success: true,
            city: office.District || office.Block || office.Name || '',
            state: office.State || ''
          }
        }
        return { success: false, message: 'Invalid Pincode or no data found' }
      } catch (err: any) {
        console.warn(`[Pincode Resolver] Graceful server-side fallback. Pincode lookup failed:`, err.message || err)
        return { success: false, error: err.message || 'Pincode resolution failed' }
      }
    })
})
