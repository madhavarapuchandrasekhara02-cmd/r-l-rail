"use client";
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Printer, ArrowLeft, ShieldCheck, Truck, MapPin } from 'lucide-react'
import { getPackedWeight, TARE_WEIGHT } from '@/lib/weight'

export default function AdminLabelPage() {
  const router = useRouter()
  const params = useParams()
  const waybill = params?.waybill as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!waybill) return

    async function fetchLabelData() {
      setLoading(true)
      try {
        const { data: shipment, error: shipError } = await supabase
          .from('shipments')
          .select('*, orders(*, order_items(*))')
          .eq('waybill', waybill)
          .maybeSingle()

        if (shipError) throw shipError
        if (!shipment) {
          setError('No shipment found for this Waybill.')
          return
        }

        setData(shipment)
      } catch (err: any) {
        console.error('Error fetching label data:', err)
        setError(err.message || 'Failed to load shipping label.')
      } finally {
        setLoading(false)
      }
    }

    fetchLabelData()
  }, [waybill])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#B37943] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#B37943] font-serif italic text-lg">Formulating Printable Label...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl font-bold text-rose-600 mb-4">{error || 'Label data unavailable'}</p>
        <button onClick={() => router.push('/orders')} className="px-6 py-3 bg-[#4A3525] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#B37943] transition-colors">
          Back to Orders
        </button>
      </div>
    )
  }

  const order = data.orders
  const orderItems = order?.order_items || []
  
  // Calculate dynamic weight with packaging tare box weight
  const weight = orderItems.reduce((acc: number, item: any) => {
    return acc + (item.quantity * getPackedWeight(item.variant_label || ''))
  }, 0) + TARE_WEIGHT

  return (
    <div className="min-h-screen bg-[#F0E6D9]/30 p-4 sm:p-8 flex flex-col items-center select-none font-sans">
      {/* Control Buttons - Hidden during print */}
      <div className="w-full max-w-[500px] flex items-center justify-between gap-4 mb-8 print:hidden">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 px-5 py-3 border border-[#E5C492] text-[#4A3525] hover:bg-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 px-6 py-3 bg-[#B37943] text-white hover:bg-[#96612F] rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all"
        >
          <Printer className="w-4 h-4" /> Print Sticky Label
        </button>
      </div>

      {/* Delhivery Standard Label Template (4" x 6" layout) */}
      <div className="w-[100mm] min-h-[150mm] bg-white border-2 border-black p-4 text-black flex flex-col justify-between shadow-2xl relative print:border-0 print:shadow-none print:w-full print:h-screen print:p-0">
        
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
          <span className="text-[11px] font-mono font-bold tracking-[0.2em]">{waybill}</span>
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
            <div className="font-bold text-[10px]">Roots & Leaves</div>
            <div className="text-gray-600 leading-tight">
              10-1-62, Chaitanya Nagar,<br />
              Gajuwaka, Visakhapatnam,<br />
              Andhra Pradesh 531036
            </div>
            <div className="font-bold text-[8px] mt-auto">BHEEMAVARAPU SURFACE</div>
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
          <span className="font-mono">Doc Date: {new Date(data.shipped_at || data.created_at).toLocaleDateString()}</span>
        </div>
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
        }
      `}</style>
    </div>
  )
}
