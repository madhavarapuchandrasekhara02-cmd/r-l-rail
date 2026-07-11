"use client";
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Package, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertCircle, 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft, 
  AlertTriangle
} from 'lucide-react'
import { trpc } from '@/providers/trpc'

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
}

export default function AdminTracker() {
  const [searchQuery, setSearchQuery] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [ordersList, setOrdersList] = useState<any[] | null>(null)
  const [error, setError] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')

  const { data: trackData, isLoading: trackLoading, refetch } = trpc.order.track.useQuery(
    { query: submittedQuery },
    { enabled: !!submittedQuery }
  )

  // Construct queries for trpc live shipment tracking, enabled if waybill exists
  const waybill = order?.shipments?.[0]?.waybill || ''
  const ordStatus = order?.status?.toLowerCase() || ''
  const shipment = order?.shipments?.[0]

  const { data: trackingData, isLoading: trackingLoading } = trpc.shipping.trackShipment.useQuery(
    { waybill },
    { enabled: !!waybill }
  )

  // Normalize live status from Delhivery One API
  const liveStatus = trackingData?.success ? trackingData.status?.toLowerCase() : ''
  const dbStatus = shipment?.tracking_status?.toLowerCase() || ''
  
  // Scan statuses and locations from Delhivery
  const scanStatuses = (trackingData?.activity || []).map((s: any) => s.status?.toLowerCase() || '')
  const scanLocations = (trackingData?.activity || []).map((s: any) => s.location?.toLowerCase() || '')

  // Calculate active steps for 5-node timeline
  const step1Active = !!order
  const step2Active = ['packed', 'shipped', 'delivered'].includes(ordStatus) || ['packed', 'shipped', 'delivered'].includes(dbStatus)
  const step3Active = 
    ['shipped', 'delivered'].includes(ordStatus) || 
    !!waybill || 
    shipment?.pickup_status?.toLowerCase() === 'scheduled' || 
    !!shipment?.pickup_scheduled_time
  const step4Active = 
    ['shipped', 'delivered'].includes(ordStatus) ||
    ['shipped', 'delivered'].includes(dbStatus) ||
    scanStatuses.some((s: string) => s.includes('shipped') || s.includes('dispatched') || s.includes('transit'))
  const step5Active = ordStatus === 'delivered' || liveStatus === 'delivered' || dbStatus === 'delivered'

  const steps = [
    { status: 'Order Confirmed', icon: ShoppingBag, active: step1Active, desc: 'Order received and logged' },
    { status: 'Packed', icon: Package, active: step2Active, desc: 'Package sealed at apothecary' },
    { status: 'Pickup Scheduled', icon: Calendar, active: step3Active, desc: 'Courier vehicle slot booked' },
    { status: 'Dispatched', icon: Truck, active: step4Active, desc: 'Ritual is on the way to you' },
    { status: 'Delivered', icon: CheckCircle2, active: step5Active, desc: 'Successfully handed over' }
  ]

  React.useEffect(() => {
    if (!submittedQuery) return
    if (trackData) {
      if (!trackData.success) {
        setError(trackData.error || 'No matching orders found. Please verify details.')
        setOrder(null)
        setOrdersList(null)
      } else {
        const data = trackData.orders || []
        if (data.length === 0) {
          setError('No matching orders found. Please verify details.')
          setOrder(null)
          setOrdersList(null)
        } else if (data.length > 1) {
          setOrdersList(data)
          setOrder(null)
          setError('')
        } else {
          setOrder(data[0])
          setOrdersList(null)
          setError('')
        }
      }
    }
  }, [trackData, submittedQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    setError('')
    setOrder(null)
    setOrdersList(null)
    if (submittedQuery === query) {
      refetch()
    } else {
      setSubmittedQuery(query)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'text-green-600 bg-green-50 border-green-100'
      case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-100'
      case 'processing': return 'text-orange-600 bg-orange-50 border-orange-100'
      case 'paid': return 'text-emerald-600 bg-emerald-50 border-emerald-100'
      default: return 'text-[#6A6661] bg-[#FAF9F6] border-[#E5C492]/30'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto selection:bg-[#B37943]/20 selection:text-[#B37943]">
      {/* Luxury Earthy Header */}
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[#B37943] text-xs font-bold uppercase tracking-[0.22em] font-sans">
          <Search className="w-3.5 h-3.5" /> Customer Care Toolkit
        </div>
        <h1 className="text-4xl font-serif text-[#4A3525] font-semibold">Quick Order Tracker</h1>
        <p className="text-xs text-[#B37943] italic font-serif">
          On-demand customer order lookup. Instantly check courier waybills and parcel histories.
        </p>
      </header>

      {/* Lightweight Search Bar */}
      <section className="bg-white rounded-2xl border border-[#E5C492] p-6 shadow-sm shadow-[#4A3525]/3 no-print">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#B37943]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Customer Mobile Number or Order ID..."
              className="w-full h-12 pl-10 pr-4 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4A3525] text-[#4A3525]"
            />
          </div>
          <button
            type="submit"
            disabled={trackLoading}
            className="h-12 px-6 bg-[#4A3525] hover:bg-[#32241b] text-white rounded-xl text-xs font-sans font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {trackLoading ? 'Searching...' : 'Search Ledger'}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-xs border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}
      </section>

      {/* Results Workspace */}
      <main className="min-h-[200px]">
        <AnimatePresence mode="wait">
          {trackLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-[#B37943]">
              <div className="w-8 h-8 border-2 border-[#B37943] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-[10px] uppercase tracking-widest font-bold font-sans">Accessing database indices...</p>
            </motion.div>
          )}

          {/* List of matched orders */}
          {ordersList && !order && !trackLoading && (
            <motion.div {...fadeUp} className="bg-white rounded-3xl border border-[#E5C492] p-6 sm:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-xl text-[#4A3525] font-serif font-bold">Multiple Orders Found</h2>
                <p className="text-xs text-[#B37943] italic mt-0.5">Several orders match this search. Select one to inspect courier details:</p>
              </div>

              <div className="space-y-3">
                {ordersList.map(ord => (
                  <div key={ord.id} className="p-4 bg-[#FAF9F6] border border-[#E5C492]/40 rounded-xl hover:border-[#B37943] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#4A3525]">{ord.order_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getStatusColor(ord.status)}`}>
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#B37943] mt-1">
                        Placed on {new Date(ord.created_at).toLocaleDateString()} | Recipient: <strong>{ord.customer_name}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => setOrder(ord)}
                      className="h-9 px-4 bg-[#FAF3E8] border border-[#E5C492] hover:bg-[#B37943] hover:text-white text-[#B37943] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Track Order <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Focused Single Order Tracker */}
          {order && !trackLoading && (
            <motion.div {...fadeUp} className="space-y-6">
              {ordersList && (
                <button
                  onClick={() => setOrder(null)}
                  className="flex items-center gap-1.5 text-xs text-[#B37943] hover:underline font-bold uppercase tracking-wider no-print cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Search List
                </button>
              )}

              <div className="bg-white rounded-3xl border border-[#E5C492] overflow-hidden flex flex-col md:flex-row shadow-sm">
                {/* Visual Timeline (Left) */}
                <div className="w-full md:w-[45%] bg-[#FAF9F6] p-6 sm:p-8 border-b md:border-b-0 md:border-r border-[#E5C492]/40">
                  <h3 className="text-sm font-serif text-[#4A3525] font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#B37943]" /> Shipment Journey Stages
                  </h3>

                  <div className="relative">
                    {/* Vertical Progress Bar */}
                    <div className="absolute left-[18px] top-4 bottom-4 w-[1px] bg-[#E5C492]/30" />

                    <div className="space-y-6">
                      {steps.map((step, i) => (
                        <div key={i} className="relative flex items-start gap-4">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 border-2 border-white shadow-sm transition-all duration-300 ${
                            step.active 
                              ? 'bg-[#B37943] text-white scale-105 shadow-[#B37943]/20' 
                              : 'bg-white text-[#E5C492]/50 border-[#E5C492]/40'
                          }`}>
                            <step.icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col">
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${step.active ? 'text-[#4A3525]' : 'text-[#B37943]/40'}`}>
                              {step.status}
                            </h4>
                            <p className={`text-[10px] italic mt-0.5 ${step.active ? 'text-[#8B7355]' : 'text-[#8B7355]/40'}`}>{step.desc}</p>
                          </div>
                          {step.active && i < 4 && steps[i + 1].active && (
                            <div className="absolute left-[18px] top-9 h-6 w-[2px] bg-[#E5C492] z-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Details Sheet (Right) */}
                <div className="flex-1 p-6 sm:p-8 flex flex-col space-y-6">
                  {/* Order Core Info */}
                  <header className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-[#FAF3E8]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#4A3525]">{order.order_number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#B37943] mt-1">
                        Recipient: <strong>{order.customer_name}</strong> | Pincode: <strong>{order.pincode}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[#B37943] font-sans">Created on {new Date(order.created_at).toLocaleDateString()}</div>
                      <div className="text-xs font-bold text-[#4A3525] font-serif mt-0.5">Value: ₹{order.total}</div>
                    </div>
                  </header>

                  {/* Destination detail */}
                  <div>
                    <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-[0.2em] font-sans">Shipping Address</span>
                    <p className="text-xs text-[#4A3525] font-serif mt-1">
                      {order.address}, {order.city}, {order.state} - {order.pincode}
                    </p>
                  </div>

                  {/* Products inside order */}
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-[0.2em] font-sans">Order Inventory</span>
                    <div className="mt-2 space-y-2 border border-[#E5C492]/20 rounded-xl p-3 bg-[#FAF9F6]/50">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-xs text-[#4A3525] pb-2 border-b border-[#FAF3E8] last:border-0 last:pb-0">
                          <div>
                            <span className="font-semibold">{item.product_name}</span>
                            <span className="text-[9px] text-[#B37943] ml-1.5 font-sans uppercase">({item.variant_label})</span>
                          </div>
                          <span className="font-bold">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delhivery Live Activity Log */}
              {waybill && (
                <div className="bg-white rounded-3xl border border-[#E5C492] p-6 sm:p-8 space-y-6 shadow-sm">
                  <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#FAF3E8]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#B37943]/10 flex items-center justify-center text-[#B37943]">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base text-[#4A3525] font-serif font-bold">Delhivery One Live Courier Journeys</h4>
                          <div className="text-[10px] font-bold text-[#B37943] uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                            AWB Tracking ID: <span className="text-[#4A3525] bg-[#B37943]/10 px-1.5 py-0.5 rounded select-all cursor-pointer" onClick={() => navigator.clipboard.writeText(waybill)} title="Click to copy">{waybill}</span>
                          </div>
                        </div>
                      </div>

                      <a
                        href="https://www.delhivery.com/tracking"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-6 bg-white hover:bg-[#FAF9F6] border border-[#E5C492] text-[#4A3525] rounded-full text-[10px] font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                      >
                        Open Live Portal
                      </a>
                    </div>
                    <div className="w-full text-[10px] text-[#8B7355] italic bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E5C492]/30 mt-2">
                      <strong className="font-sans uppercase tracking-wider text-[#B37943] text-[9px] block mb-0.5">To track on Delhivery&apos;s official portal:</strong>
                      Click the button above and copy-paste the Waybill ID (<strong className="select-all text-[#4A3525] cursor-pointer" onClick={() => navigator.clipboard.writeText(waybill)}>{waybill}</strong>), or enter the customer&apos;s mobile number on their website.
                    </div>
                  </header>

                  {trackingLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-[#B37943]">
                      <div className="w-6 h-6 border-2 border-[#B37943] border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-xs italic">Syncing package transit logs...</span>
                    </div>
                  ) : trackingData?.success ? (
                    <div className="relative pl-6 space-y-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                      <div className="absolute left-[5px] top-2 bottom-2 w-[1px] bg-[#E5C492]/20" />

                      {trackingData.activity?.map((scan: any, sIdx: number) => (
                        <div key={sIdx} className="relative flex gap-6 items-start">
                          <div className={`w-3.5 h-3.5 rounded-full absolute left-[-2px] border-2 border-white shadow-sm ${
                            sIdx === 0 ? 'bg-[#B37943] scale-110' : 'bg-[#E5C492]/40'
                          }`} />

                          <div className="pl-6 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs text-[#4A3525]">
                            <span className={`font-bold uppercase tracking-wide ${sIdx === 0 ? 'text-[#B37943]' : ''}`}>
                              {scan.status}
                            </span>
                            <div className="flex items-center gap-1.5 text-[#B37943]">
                              <MapPin className="w-3.5 h-3.5" /> {scan.location || 'Hub'}
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono sm:text-right">
                              {scan.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-3 text-xs text-[#8B7355]">
                      <AlertTriangle className="w-4 h-4 text-[#B37943] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#4A3525]">Tracking status sync pending</p>
                        <p className="mt-0.5">{trackingData?.error || 'Delhivery databases are currently syncing. Journey logs will populate shortly.'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {!submittedQuery && !trackLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 bg-white border border-[#E5C492]/30 rounded-[2rem] text-center p-8">
              <ShoppingBag className="w-12 h-12 text-[#B37943]/40 mb-4 stroke-1" />
              <h3 className="text-lg font-serif text-[#4A3525] font-semibold mb-1">Lookup Workspace Ready</h3>
              <p className="text-xs text-[#B37943]">
                Enter a Customer Mobile Number or Order ID above to perform a clean, on-demand courier lookup.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
