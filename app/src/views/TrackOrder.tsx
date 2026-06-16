"use client";
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, MapPin, Calendar, Clock, AlertCircle, ShoppingBag, Truck, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react'
// Removed direct supabase client import for security hardening
import PageWrapper from '@/components/PageWrapper'
import { trpc } from '@/providers/trpc'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
}

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [ordersList, setOrdersList] = useState<any[] | null>(null)
  const [error, setError] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')

  const { data: trackData, isLoading: trackLoading, refetch } = trpc.order.track.useQuery(
    { query: submittedQuery },
    { enabled: !!submittedQuery }
  )

  const loading = trackLoading

  // Construct queries for trpc live shipment tracking, enabled if waybill exists
  const waybill = order?.shipments?.[0]?.waybill || ''
  const isDelivered = order?.status === 'Delivered'

  const { data: trackingData, isLoading: trackingLoading } = trpc.shipping.trackShipment.useQuery(
    { waybill },
    { enabled: !!waybill }
  )

  // Calculate active steps for 8-node elegant timeline
  const shipment = order?.shipments?.[0]
  
  // Normalize live status
  const liveStatus = (trackingData?.success ? trackingData.status?.toLowerCase() : '') || ''
  const dbStatus = shipment?.tracking_status?.toLowerCase() || ''
  const ordStatus = order?.status?.toLowerCase() || ''
  
  // Scan statuses and locations
  const scanStatuses = (trackingData?.activity || []).map((s: any) => s.status?.toLowerCase() || '')
  const scanLocations = (trackingData?.activity || []).map((s: any) => s.location?.toLowerCase() || '')

  // 1. Order Confirmed: always true if order exists
  const step1Active = true

  // 2. Packed: packed, shipped, or delivered
  const step2Active = ['packed', 'shipped', 'delivered'].includes(ordStatus) || ['packed', 'shipped', 'delivered'].includes(dbStatus)

  // 3. Pickup Scheduled: schedule created
  const step3Active = 
    ['shipped', 'delivered'].includes(ordStatus) ||
    ['shipped', 'delivered'].includes(dbStatus) ||
    shipment?.pickup_status?.toLowerCase() === 'scheduled' || 
    !!shipment?.pickup_scheduled_time ||
    scanStatuses.some((s: string) => s.includes('pickup') || s.includes('manifest'))

  // 4. Dispatched: marked dispatched in admin
  const step4Active = 
    ['shipped', 'delivered'].includes(ordStatus) ||
    ['shipped', 'delivered'].includes(dbStatus) ||
    scanStatuses.some((s: string) => s.includes('shipped') || s.includes('dispatched') || s.includes('transit'))

  // 5. Delivered: successfully received
  const step5Active = ordStatus === 'delivered' || liveStatus.includes('delivered') || dbStatus === 'delivered'

  const steps = [
    { status: 'Order Confirmed', icon: ShoppingBag, active: step1Active, desc: 'Your ritual has been received' },
    { status: 'Packed', icon: Package, active: step2Active, desc: 'Sandalwood & ritual items packed' },
    { status: 'Pickup Scheduled', icon: Calendar, active: step3Active, desc: 'Courier scheduled to collect' },
    { status: 'Dispatched', icon: Truck, active: step4Active, desc: 'Ritual is on the way to you' },
    { status: 'Delivered', icon: CheckCircle2, active: step5Active, desc: 'Successfully received' }
  ]

  React.useEffect(() => {
    if (!submittedQuery) return
    if (trackData) {
      if (!trackData.success) {
        setError(trackData.error || 'No orders found. Please check your Order ID or Phone Number and try again.')
        setOrder(null)
        setOrdersList(null)
      } else {
        const data = trackData.orders || []
        if (data.length === 0) {
          setError('No orders found. Please check your Order ID or Phone Number and try again.')
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

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = orderId.trim()
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
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'shipped': return 'text-blue-600 bg-blue-100'
      case 'processing': return 'text-orange-600 bg-orange-100'
      case 'paid': return 'text-emerald-600 bg-emerald-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <PageWrapper>
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="label-luxury-small">Ritual Journey</span>
            <h1 className="text-4xl md:text-5xl text-[#4A3525] mt-6 font-serif">Track Your Order</h1>
            <p className="mt-6 text-[#8B7355] font-sans">
              Enter your Order Number or Phone Number to follow your sacred ritual's journey.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="max-w-2xl mx-auto">
            <form onSubmit={handleTrack} className="relative group">
              <input 
                type="text" 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Order Number or Phone Number"
                className="w-full h-16 md:h-20 pl-8 pr-32 rounded-3xl bg-white/60 backdrop-blur-md border border-[#E5C492]/30 shadow-xl focus:border-[#B37943] focus:bg-white outline-none transition-all font-sans text-lg text-[#4A3525]"
              />

              <button 
                type="submit"
                disabled={loading}
                className="absolute right-3 top-3 bottom-3 px-8 bg-[#B37943] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#96612F] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Searching...' : (
                  <>
                    Track <Search className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-2xl text-sm border border-red-100 font-sans">
                <AlertCircle className="w-4 h-4" /> {error}
              </motion.div>
            )}
          </motion.div>

          {/* Order Status Result */}
          <AnimatePresence mode="wait">
            {/* 1. Multiple Orders List Selection (Queried by phone number) */}
            {ordersList && !order && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }}
                className="mt-12 space-y-6"
              >
                <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-[#E5C492]/20 shadow-2xl p-8 md:p-12">
                  <h2 className="text-2xl text-[#4A3525] font-serif mb-2">Multiple Orders Found</h2>
                  <p className="text-[#8B7355] text-sm mb-8 font-sans">
                    Here are all the orders placed under your phone number. Select one to track its real-time progress.
                  </p>
                  
                  <div className="space-y-6">
                    {ordersList.map((ord: any) => (
                      <div key={ord.id} className="p-6 rounded-2xl bg-[#F3E9D7]/20 border border-[#EADCC8]/40 hover:bg-[#F3E9D7]/40 hover:border-[#B37943]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-[#4A3525] font-sans">#{ord.order_number}</span>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusColor(ord.status)}`}>
                              {ord.status}
                            </span>
                          </div>
                          
                          <p className="text-xs text-[#8B7355] font-sans">
                            Placed on: {new Date(ord.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                          
                          <p className="text-xs text-[#4A3525] font-serif truncate max-w-[280px] md:max-w-md">
                            {ord.order_items?.map((item: any) => `${item.product_name} (${item.variant_label}) x${item.quantity}`).join(', ')}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end gap-6">
                          <div className="text-right font-sans">
                            <p className="text-[10px] text-[#8B7355] uppercase tracking-tighter">Value</p>
                            <p className="text-sm font-bold text-[#4A3525]">₹{ord.total}</p>
                          </div>
                          
                          <button 
                            onClick={() => setOrder(ord)}
                            className="h-12 px-6 bg-[#B37943] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#96612F] shadow-md hover:shadow-lg transition-all flex items-center gap-2 group-hover:translate-x-1"
                          >
                            Track Shipment <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. Detailed Single Order Tracking View */}
            {order && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }}
                className="mt-12 space-y-8"
              >
                {/* Back Button if we have a multi-order list cached */}
                {ordersList && (
                  <button 
                    onClick={() => setOrder(null)} 
                    className="flex items-center gap-2 text-xs text-[#B37943] hover:underline font-bold uppercase tracking-widest mb-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to My Orders List
                  </button>
                )}

                <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-[#E5C492]/20 shadow-2xl overflow-hidden flex flex-col md:flex-row">
                  
                  {/* Left Column: Vertical Timeline */}
                  <div className="w-full md:w-[42%] bg-[#F3E9D7]/20 p-6 md:p-8 border-b md:border-b-0 md:border-r border-[#EADCC8]/40">
                    <h2 className="text-xl text-[#4A3525] font-serif italic mb-8 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-[#B37943]" /> Ritual Progress
                    </h2>
                    
                    <div className="relative">
                      {/* Vertical Progress Line */}
                      <div className="absolute left-[18px] top-4 bottom-4 w-[1px] bg-[#EADCC8]" />
                      
                      <div className="space-y-6">
                        {steps.map((step, i) => (
                          <div key={i} className="relative flex items-center gap-4 group">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 border-2 border-white shadow-sm transition-all duration-500 ${step.active ? 'bg-[#B37943] text-white scale-110 shadow-[#B37943]/20' : 'bg-white text-[#EADCC8] border-[#EADCC8]/50'}`}>
                              <step.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col">
                              <h4 className={`text-[11px] font-bold uppercase tracking-widest ${step.active ? 'text-[#4A3525]' : 'text-[#8B7355]/40'}`}>
                                {step.status}
                              </h4>
                              <p className="text-[9px] text-[#8B7355] italic mt-0.5">{step.desc}</p>
                            </div>
                            {step.active && i < 4 && steps[i + 1].active && (
                               <div className="absolute left-[18px] top-9 h-6 w-[1px] bg-[#B37943] z-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Order Info & Items */}
                  <div className="flex-1 p-8 md:p-12 flex flex-col">
                    <div className="flex flex-wrap justify-between items-start gap-8 mb-12">
                      <div className="space-y-4">
                        <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm ${getStatusColor(order.status)}`}>
                          {order.status || 'Active'}
                        </div>
                        <p className="text-sm text-[#8B7355] font-sans">
                          Manifest ID: <span className="text-[#4A3525] font-bold">#{order.order_number}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-8 text-[11px] font-sans border-l border-[#EADCC8]/40 pl-8">
                        <div className="flex flex-col">
                          <span className="text-[#8B7355] opacity-60 uppercase tracking-tighter mb-0.5">Ritual Date</span>
                          <span className="text-[#4A3525] font-bold">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#8B7355] opacity-60 uppercase tracking-tighter mb-0.5">Total Value</span>
                          <span className="text-[#4A3525] font-bold">₹{order.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inventory List */}
                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-[#4A3525] uppercase tracking-[0.2em] mb-6 flex items-center gap-2 opacity-60">
                        <Package className="w-3.5 h-3.5" /> Ritual Inventory
                      </h3>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center pb-4 border-b border-[#EADCC8]/20 last:border-0 last:pb-0">
                            <div>
                              <p className="text-[13px] font-bold text-[#4A3525]">{item.product_name}</p>
                              <p className="text-[10px] text-[#8B7355] uppercase tracking-wider">{item.variant_label} × {item.quantity}</p>
                            </div>
                            <p className="text-[13px] font-bold text-[#4A3525]">₹{item.price * item.quantity}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-[#EADCC8]/40">
                      <p className="text-[10px] text-[#8B7355] italic leading-relaxed">
                        Your ritual artifacts are being handled with the utmost sanctity. Standard delivery across India takes 5-7 business days.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delhivery One Live Tracking Scans */}
                {waybill && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="bg-white/80 backdrop-blur-md rounded-[32px] border border-[#E5C492]/20 shadow-2xl p-8 md:p-12 space-y-8"
                  >
                      <div className="flex flex-col gap-4 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#B37943]/10 flex items-center justify-center text-[#B37943]">
                              <Truck className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-xl text-[#4A3525] font-serif">Delhivery Live Courier Journey</h3>
                              <p className="text-[10px] text-[#B37943] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-2">
                                Waybill: <span className="text-[#4A3525] bg-[#B37943]/10 px-1.5 py-0.5 rounded select-all cursor-pointer" onClick={() => navigator.clipboard.writeText(waybill)} title="Click to copy">{waybill}</span>
                              </p>
                            </div>
                          </div>
                          <a
                            href="https://www.delhivery.com/tracking"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 px-6 bg-[#B37943] hover:bg-[#96612F] text-white rounded-full text-[10px] font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                          >
                            Open Live Portal
                          </a>
                        </div>
                        <p className="text-[11px] text-[#8B7355] italic bg-[#FAF9F6] p-3 rounded-xl border border-[#E5C492]/30 mt-2">
                          <strong className="font-sans uppercase tracking-wider text-[#B37943] text-[9px] block mb-1">To track on Delhivery&apos;s official portal:</strong>
                          Click the button above and copy-paste your Waybill ID (<strong className="select-all text-[#4A3525] cursor-pointer" onClick={() => navigator.clipboard.writeText(waybill)}>{waybill}</strong>), or simply enter your registered mobile number on their website.
                        </p>
                      </div>

                    {trackingLoading ? (
                      <div className="py-12 text-center flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-[#B37943] border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm text-[#8B7355] italic">Syncing live scanner activity log...</p>
                      </div>
                    ) : trackingData?.success ? (
                      <div className="relative pl-6 space-y-8 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="absolute left-[5px] top-2 bottom-2 w-[1px] bg-[#EADCC8]/40" />
                        
                        {trackingData.activity?.map((scan: any, sIdx: number) => (
                          <div key={sIdx} className="relative flex gap-6 items-start group">
                            {/* Bullet dot */}
                            <div className={`w-3.5 h-3.5 rounded-full absolute left-[-2px] border-2 border-white shadow-sm transition-all duration-300 ${sIdx === 0 ? 'bg-[#B37943] scale-125' : 'bg-[#EADCC8]'}`} />
                            
                            <div className="pl-6 flex-1 grid md:grid-cols-3 gap-3 items-center">
                              <div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${sIdx === 0 ? 'text-[#B37943]' : 'text-[#4A3525]'}`}>{scan.status}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-[#8B7355]">
                                <MapPin className="w-3.5 h-3.5 text-[#B37943]/60" /> {scan.location}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono md:text-right">
                                {scan.time}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-3 text-sm text-[#8B7355]">
                        <AlertCircle className="w-5 h-5 text-[#B37943] shrink-0" />
                        <div>
                          <p className="font-bold text-[#4A3525]">Tracking status synchronization delay</p>
                          <p className="mt-1 text-xs">{trackingData?.error || 'Delhivery One database records are currently updating. Live scan logs will load momentarily.'}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PageWrapper>
  )
}
