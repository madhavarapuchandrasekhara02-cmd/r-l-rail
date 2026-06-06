"use client";
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Printer, ArrowLeft, ShieldCheck, Truck, MapPin } from 'lucide-react'

export default function AdminBatchLabelsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const waybillsParam = searchParams?.get('waybills')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shipments, setShipments] = useState<any[]>([])

  useEffect(() => {
    if (!waybillsParam) {
      setError('No Waybill parameters provided in the URL query.')
      setLoading(false)
      return
    }

    async function fetchBatchData() {
      setLoading(true)
      try {
        const waybillsArray = waybillsParam!.split(',')
        const { data, error: fetchError } = await supabase
          .from('shipments')
          .select('*, orders(*, order_items(*))')
          .in('waybill', waybillsArray)

        if (fetchError) throw fetchError
        if (!data || data.length === 0) {
          setError('No shipping manifests found for the provided Waybills.')
          return
        }

        // Keep them sorted in the same order as requested waybills Array
        const sortedData = data.sort((a, b) => {
          return waybillsArray.indexOf(a.waybill) - waybillsArray.indexOf(b.waybill)
        })

        setShipments(sortedData)
      } catch (err: any) {
        console.error('Error fetching batch labels:', err)
        setError(err.message || 'Failed to load batch shipping labels.')
      } finally {
        setLoading(false)
      }
    }

    fetchBatchData()
  }, [waybillsParam])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#B37943] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#B37943] font-serif italic text-lg animate-pulse">Formulating Batch Labels...</p>
      </div>
    )
  }

  if (error || shipments.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl font-bold text-rose-600 mb-4">{error || 'Label data unavailable'}</p>
        <button 
          onClick={() => router.push('/admin/orders')} 
          className="px-6 py-3 bg-[#4A3525] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#B37943] transition-colors shadow-md"
        >
          Back to Orders
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0E6D9]/30 p-4 sm:p-8 flex flex-col items-center select-none font-sans pb-20 print:p-0 print:bg-white">
      {/* Control Buttons - Hidden during print */}
      <div className="w-full max-w-[600px] bg-white border border-[#E5C492] rounded-[2rem] p-5 flex items-center justify-between gap-4 mb-8 shadow-md print:hidden">
        <div className="flex flex-col">
          <span className="text-xs text-[#B37943] font-bold uppercase tracking-widest">Delhivery Batch Mode</span>
          <span className="text-sm font-black text-[#4A3525]">{shipments.length} Labels Loaded</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/admin/orders')} 
            className="flex items-center gap-2 px-4 py-2.5 border border-[#E5C492] text-[#4A3525] hover:bg-[#FAF9F6] rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 px-5 py-2.5 bg-[#B37943] text-white hover:bg-[#96612F] rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" /> Print Roll
          </button>
        </div>
      </div>

      {/* Sequential labels layout */}
      <div className="flex flex-col gap-10 print:gap-0 print:w-full">
        {shipments.map((shipment) => {
          const order = shipment.orders
          const orderItems = order?.order_items || []
          
          // Calculate dynamic weight with packaging tare box weight
          const weight = orderItems.reduce((acc: number, item: any) => {
            let itemWeight = 250 // default fallback
            const labelLower = (item.variant_label || '').toLowerCase()
            if (labelLower.includes('100ml') || labelLower.includes('100g')) {
              itemWeight = 150
            } else if (labelLower.includes('200ml') || labelLower.includes('250ml') || labelLower.includes('200g') || labelLower.includes('250g')) {
              itemWeight = 300
            } else if (labelLower.includes('500ml') || labelLower.includes('500g')) {
              itemWeight = 600
            }
            return acc + (item.quantity * itemWeight)
          }, 0) + 50 // add 50g tare weight for packaging box

          return (
            <div 
              key={shipment.id} 
              className="batch-label-card w-[100mm] min-h-[150mm] bg-white border-2 border-black p-4 text-black flex flex-col justify-between shadow-2xl relative print:border-0 print:shadow-none print:w-[100mm] print:h-[150mm] print:p-0 print:mx-auto print:break-after-page print:page-break-after-always"
            >
              {/* Header section */}
              <div className="border-b border-black pb-2 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-black tracking-tighter uppercase font-serif text-[#B37943]">DELHIVERY ONE</span>
                  <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Express Cargo Division</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-xs font-black tracking-widest uppercase">PREPAID</span>
                  <span className="text-[9px] font-black text-black border border-black px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-tighter">Order: {order?.order_number}</span>
                </div>
              </div>

              {/* Barcode section (High Fidelity Mockup) */}
              <div className="py-4 border-b border-black flex flex-col items-center justify-center">
                <div className="w-full h-14 flex items-stretch gap-[1.5px] px-2 mb-1.5 overflow-hidden">
                  {/* Elegant programmatic mock barcode blocks */}
                  {[2,1,3,1,4,2,1,3,2,1,4,1,2,3,1,2,4,1,3,2,1,4,2,1,3,1,4,2,1,3,2,1,4,1,2,3,1,2,4,1,3,2,1,4].map((width, idx) => (
                    <div key={idx} className="bg-black flex-1" style={{ opacity: idx % 2 === 0 ? 1 : 0 }} />
                  ))}
                </div>
                <span className="text-[11px] font-mono font-bold tracking-[0.2em]">{shipment.waybill}</span>
              </div>

              {/* Route details grid */}
              <div className="grid grid-cols-3 border-b border-black text-center divide-x divide-black">
                <div className="p-2 flex flex-col justify-center">
                  <span className="text-[7px] text-gray-500 uppercase font-bold">Origin Port</span>
                  <span className="text-xs font-black">HYD/SEC</span>
                </div>
                <div className="p-2 flex flex-col justify-center bg-black text-white">
                  <span className="text-[7px] text-gray-200 uppercase font-semibold">Routing Hub</span>
                  <span className="text-xs font-black uppercase">{order?.city?.slice(0, 3) || 'BHO'}</span>
                </div>
                <div className="p-2 flex flex-col justify-center">
                  <span className="text-[7px] text-gray-500 uppercase font-bold">Pincode Zone</span>
                  <span className="text-xs font-black tracking-wider">{order?.pincode}</span>
                </div>
              </div>

              {/* Sender and Receiver information */}
              <div className="grid grid-cols-2 border-b border-black text-[9px] divide-x divide-black flex-1">
                {/* Ship To (Receiver) */}
                <div className="p-3 space-y-1.5 flex flex-col">
                  <span className="text-[7px] text-gray-500 uppercase font-extrabold tracking-widest flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-[#B37943]" /> Ship To (Buyer)
                  </span>
                  <div className="font-extrabold text-xs">{order?.customer_name}</div>
                  <div className="text-gray-700 leading-tight font-medium uppercase break-words">
                    {order?.address}<br />
                    {order?.city}, {order?.state} - <strong className="text-black">{order?.pincode}</strong>
                  </div>
                  <div className="font-bold text-[8px] mt-auto">Phone: {order?.customer_phone}</div>
                </div>

                {/* Ship From (Sender) */}
                <div className="p-3 space-y-1.5 flex flex-col">
                  <span className="text-[7px] text-gray-500 uppercase font-extrabold tracking-widest flex items-center gap-1">
                    <Truck className="w-2.5 h-2.5 text-[#B37943]" /> Ship From (Seller)
                  </span>
                  <div className="font-bold text-[10px]">Roots & Leaves Pvt Ltd</div>
                  <div className="text-gray-600 leading-tight">
                    10-1-62, Chaitanya Nagar,<br />
                    Gajuwaka,<br />
                    Visakhapatnam, Andhra Pradesh 530026
                  </div>
                  <div className="font-bold text-[8px] mt-auto">Phone: +91 99999 88888</div>
                </div>
              </div>

              {/* Package detail parameters */}
              <div className="grid grid-cols-4 border-b border-black divide-x divide-black text-[8px] font-bold text-center">
                <div className="p-1.5 flex flex-col justify-center">
                  <span className="text-gray-500 text-[6px] uppercase font-semibold">Weight</span>
                  <span>{weight} Gms</span>
                </div>
                <div className="p-1.5 flex flex-col justify-center">
                  <span className="text-gray-500 text-[6px] uppercase font-semibold">Dimensions</span>
                  <span>22 x 15 x 8 Cm</span>
                </div>
                <div className="p-1.5 flex flex-col justify-center">
                  <span className="text-gray-500 text-[6px] uppercase font-semibold">Qty</span>
                  <span>{orderItems.reduce((acc: number, item: any) => acc + item.quantity, 0)} Pcs</span>
                </div>
                <div className="p-1.5 flex flex-col justify-center">
                  <span className="text-gray-500 text-[6px] uppercase font-semibold">Inv Total</span>
                  <span className="text-[9px] font-extrabold">₹{order?.total}</span>
                </div>
              </div>

              {/* Product manifest list */}
              <div className="p-3 text-[7.5px] border-b border-black flex-1">
                <div className="font-extrabold uppercase text-gray-500 tracking-wider mb-1">Package Contents Manifest</div>
                <div className="space-y-1">
                  {orderItems.map((item: any, index: number) => (
                    <div key={item.id} className="flex justify-between font-medium">
                      <span>{index + 1}. {item.product_name} ({item.variant_label})</span>
                      <span className="font-bold">x {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer legal disclaimer */}
              <div className="pt-2 flex justify-between items-center text-[7px] text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-green-700" />
                  Verified under Roots & Leaves secure packaging protocol.
                </span>
                <span className="font-mono">Doc Date: {new Date(shipment.shipped_at || shipment.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Embedded print media styling */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Perfect fitting sizes for standard 4x6 labels on printer rollers */
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          .batch-label-card {
            border: 0 !important;
            box-shadow: none !important;
            width: 100mm !important;
            height: 150mm !important;
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
