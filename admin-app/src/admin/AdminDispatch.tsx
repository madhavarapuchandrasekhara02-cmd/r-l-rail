"use client";
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { trpc } from '@/providers/trpc'
import { getPackedWeight } from '@/lib/weight'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import {
  Truck,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader,
  Check,
  Package,
  RefreshCw,
  AlertCircle,
  Clock,
  Boxes,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  FileText
} from 'lucide-react'

export default function AdminDispatch() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [shipments, setShipments] = useState<any[]>([])
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'action' | 'awaiting' | 'intransit' | 'exceptions'>('action')
  const [shipmentResults, setShipmentResults] = useState<any>(null)
  
  // Pickup form
  const [showPickupModal, setShowPickupModal] = useState(false)
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [pickupTime, setPickupTime] = useState('14:00:00')
  const [expectedPkgCount, setExpectedPkgCount] = useState(1)

  const generateLabelsMutation = trpc.dispatch.generateLabels.useMutation()
  const dispatchOrdersMutation = trpc.dispatch.dispatchOrders.useMutation()
  const schedulePickupMutation = trpc.dispatch.schedulePickup.useMutation()
  const getWaybillsMutation = trpc.dispatch.getWaybills.useMutation()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, order_items(*), shipments(*)')
        .order('created_at', { ascending: true })

      setOrders(orderData || [])

      const { data: shipData } = await supabase
        .from('shipments')
        .select('*, orders(*)')
        .order('created_at', { ascending: true })
      setShipments(shipData || [])
    } catch (err: any) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // To bypass RLS on shipments for non-admins on frontend
  const { data: recentShipments } = trpc.dispatch.getRecentShipments.useQuery(undefined, {
    refetchInterval: 10000 
  })

  // Group items by tabs
  const { actionOrders, awaitingOrders, inTransitOrders, exceptionOrders } = useMemo(() => {
    const q = searchQuery.toLowerCase()
    
    let allOrders = orders.map(o => {
      if (!o.shipments || o.shipments.length === 0) {
        const s = recentShipments?.filter((x: any) => x.order_id === o.id) || []
        return { ...o, shipments: s }
      }
      return o
    })

    // Guarantee FIFO (oldest first) by sorting explicitly by the numeric part of the order number
    allOrders.sort((a, b) => {
      const aNum = parseInt(a.order_number?.replace(/[^0-9]/g, '') || '0', 10)
      const bNum = parseInt(b.order_number?.replace(/[^0-9]/g, '') || '0', 10)
      return aNum - bNum
    })

    const filtered = allOrders.filter(o => 
      !q ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.order_number?.toLowerCase().includes(q) ||
      o.pincode?.includes(q) ||
      o.customer_phone?.includes(q)
    )

    const actionOrders = filtered.filter(o => o.status === 'Paid')
    const awaitingOrders = filtered.filter(o => o.status === 'Packed')
    const inTransitOrders = filtered.filter(o => o.status === 'Shipped')
    
    const exceptionOrders = filtered.filter(o => {
      const s = o.shipments?.[0]
      if (!s) return false
      const status = (s.tracking_status || '').toLowerCase()
      return status.includes('undelivered') || status.includes('rto') || status.includes('exception')
    })

    return { actionOrders, awaitingOrders, inTransitOrders, exceptionOrders }
  }, [orders, searchQuery, recentShipments])

  const currentList = 
    activeTab === 'action' ? actionOrders :
    activeTab === 'awaiting' ? awaitingOrders :
    activeTab === 'intransit' ? inTransitOrders : exceptionOrders

  const toggleOrder = (id: string) => {
    setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const toggleAll = () => {
    setSelectedOrderIds(prev => prev.length === currentList.length ? [] : currentList.map(o => o.id))
  }

  // Handle Label Generation (Phase 1)
  const handleGenerateLabels = async () => {
    if (selectedOrderIds.length === 0) { toast.error('Select orders to generate labels'); return }

    const loadingToastId = toast.loading(`Generating labels for ${selectedOrderIds.length} orders...`)
    
    try {
      const res = await generateLabelsMutation.mutateAsync({ orderIds: selectedOrderIds })
      setShipmentResults(res)
      loadData()
      setSelectedOrderIds([])
      
      if (!res.success && res.errors?.length) {
        toast.error(res.errors[0]?.reason || 'Label generation failed', { id: loadingToastId })
      } else if (res.errors?.length) {
        toast.success(`Generated ${res.packages?.length || 0} labels. ${res.errors.length} failed.`, { id: loadingToastId })
      } else {
        toast.success(`Successfully generated ${res.packages?.length || 0} labels!`, { id: loadingToastId })
        // Optional: Auto download labels if all succeeded
        if (res.waybills && res.waybills.length > 0) {
          window.open(`/api/dispatch/labels?waybills=${res.waybills.join(',')}`, '_blank')
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate labels', { id: loadingToastId })
    }
  }

  // Handle Mark as Dispatched (Phase 2)
  const handleDispatch = async () => {
    if (selectedOrderIds.length === 0) { toast.error('Select orders to dispatch'); return }

    const loadingToastId = toast.loading(`Dispatching ${selectedOrderIds.length} orders...`)
    try {
      const res = await dispatchOrdersMutation.mutateAsync({ orderIds: selectedOrderIds })
      loadData()
      setSelectedOrderIds([])
      if (res.success) {
        toast.success(`Successfully dispatched ${res.updatedCount} orders!`, { id: loadingToastId })
      } else {
        toast.error(res.error || 'Dispatch failed', { id: loadingToastId })
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch orders', { id: loadingToastId })
    }
  }

  // Print bulk labels for selection
  const handlePrintSelected = async () => {
    if (selectedOrderIds.length === 0) return toast.error('Select orders first')
    const toastId = toast.loading('Fetching waybills...')
    try {
      const waybills = await getWaybillsMutation.mutateAsync({ orderIds: selectedOrderIds })
      if (!waybills || waybills.length === 0) {
        toast.error('No labels found for selected orders. Generate labels first.', { id: toastId })
        return
      }
      toast.success('Downloading batch PDF...', { id: toastId })
      window.open(`/api/dispatch/labels?waybills=${waybills.join(',')}`, '_blank')
    } catch (err) {
      toast.error('Failed to fetch labels', { id: toastId })
    }
  }

  const handlePickup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await schedulePickupMutation.mutateAsync({
        expectedPackageCount: expectedPkgCount,
        pickupDate,
        pickupTime,
      })
      if (res.success) {
        toast.success('Pickup scheduled successfully!')
        setShowPickupModal(false)
      } else {
        toast.error(res.error || 'Failed to schedule pickup')
      }
    } catch (err: any) {
      toast.error(err.message || 'Pickup scheduling failed')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-6xl mx-auto selection:bg-[#B37943]/20 selection:text-[#B37943]">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#B37943] text-xs font-bold uppercase tracking-[0.22em] font-sans">
            <Boxes className="w-3.5 h-3.5" /> Dispatch Center
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#4A3525] font-semibold">Fulfillment</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#B37943]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-10 pl-9 pr-4 bg-white border border-[#E5C492] rounded-xl text-xs outline-none focus:border-[#4A3525] text-[#4A3525] shadow-sm w-48 focus:w-64 transition-all"
            />
          </div>
          <button onClick={loadData} className="w-10 h-10 bg-white border border-[#E5C492] hover:bg-[#FAF3E8] rounded-xl flex items-center justify-center text-[#B37943] active:scale-[0.98] transition-all shadow-sm cursor-pointer" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {[
          { id: 'action', label: 'Action Required', count: actionOrders.length, desc: 'Paid' },
          { id: 'awaiting', label: 'Awaiting Courier', count: awaitingOrders.length, desc: 'Packed' },
          { id: 'intransit', label: 'In Transit', count: inTransitOrders.length, desc: 'Shipped' },
          { id: 'exceptions', label: 'Exceptions', count: exceptionOrders.length, desc: 'Issues' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSelectedOrderIds([]) }}
            className={`flex flex-col min-w-[140px] p-3 rounded-2xl border transition-all text-left ${
              activeTab === tab.id 
                ? 'bg-[#4A3525] border-[#4A3525] text-white shadow-md' 
                : 'bg-white border-[#E5C492]/80 text-[#4A3525] hover:bg-[#FAF9F6]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`text-[10px] font-bold uppercase tracking-widest font-sans ${activeTab === tab.id ? 'text-[#E5C492]' : 'text-[#B37943]'}`}>{tab.label}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-[#FAF3E8] text-[#B37943]'}`}>{tab.count}</span>
            </div>
            <span className={`text-[10px] mt-2 opacity-80 ${activeTab === tab.id ? 'text-gray-300' : 'text-[#7B6856]'}`}>{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white p-3 md:p-4 rounded-2xl border border-[#E5C492] shadow-sm sticky top-4 z-20">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={selectedOrderIds.length > 0 && selectedOrderIds.length === currentList.length} onChange={toggleAll} className="rounded border-[#E5C492] text-[#4A3525] focus:ring-[#4A3525] cursor-pointer w-4 h-4" />
          <span className="text-xs font-bold text-[#4A3525] uppercase tracking-widest font-sans">{selectedOrderIds.length} Selected</span>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'action' && (
            <button
              onClick={handleGenerateLabels}
              disabled={selectedOrderIds.length === 0 || generateLabelsMutation.isPending}
              className="h-9 px-4 bg-[#4A3525] text-white hover:bg-[#32241b] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.98]"
            >
              {generateLabelsMutation.isPending ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              Generate Labels
            </button>
          )}
          {activeTab === 'awaiting' && (
            <button
              onClick={handleDispatch}
              disabled={selectedOrderIds.length === 0 || dispatchOrdersMutation.isPending}
              className="h-9 px-4 bg-[#B37943] text-white hover:bg-[#96612F] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.98]"
            >
              {dispatchOrdersMutation.isPending ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Mark Dispatched
            </button>
          )}
          {activeTab === 'awaiting' && (
            <button
              onClick={() => {
                setExpectedPkgCount(awaitingOrders.length || 1)
                setShowPickupModal(true)
              }}
              className="h-9 px-4 bg-white border border-[#E5C492] text-[#4A3525] hover:bg-[#FAF3E8] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-[0.98]"
            >
              <Calendar className="w-3.5 h-3.5 text-[#B37943]" /> Schedule Pickup
            </button>
          )}
          
          <button
            onClick={handlePrintSelected}
            disabled={selectedOrderIds.length === 0}
            className="h-9 px-4 bg-white border border-[#E5C492] text-[#4A3525] hover:bg-[#FAF3E8] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.98]"
          >
            <FileText className="w-3.5 h-3.5 text-[#B37943]" /> PDF Labels
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#B37943]">
          <Loader className="w-8 h-8 animate-spin mb-3" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5C492] shadow-sm flex flex-col min-h-[400px]">
          <div className="md:hidden divide-y divide-[#FAF3E8] overflow-y-auto max-h-[60vh] custom-scrollbar">
            {currentList.map(o => (
              <div key={o.id} className="p-3 sm:p-4 flex items-start gap-3">
                <input type="checkbox" checked={selectedOrderIds.includes(o.id)} onChange={() => toggleOrder(o.id)} className="mt-1 rounded border-[#E5C492] text-[#4A3525] focus:ring-[#4A3525] cursor-pointer shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#4A3525] truncate">{o.order_number}</span>
                    <span className="text-[10px] font-bold font-sans uppercase tracking-widest text-[#B37943] shrink-0">{o.status}</span>
                  </div>
                  <div className="text-[10px] text-[#4A3525] font-semibold mt-1 truncate">{o.customer_name}</div>
                  <div className="text-[10px] text-[#7B6856] mt-0.5 break-words whitespace-normal">{o.address}, {o.city} - {o.pincode}</div>
                  {o.shipments?.[0]?.waybill && (
                    <div className="mt-2 text-[9px] font-mono font-bold bg-[#FAF9F6] border border-[#E5C492] p-1.5 rounded text-[#B37943] inline-block">AWB: {o.shipments[0].waybill}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-auto max-h-[60vh] custom-scrollbar">
            <table className="w-full text-left border-collapse relative">
              <thead className="bg-[#FAF9F6] border-b border-[#E5C492] sticky top-0 z-10 shadow-sm">
                <tr className="text-[10px] uppercase font-sans tracking-widest text-[#B37943]">
                  <th className="py-4 px-5 w-12 text-center"></th>
                  <th className="py-4 px-4 font-semibold">Order</th>
                  <th className="py-4 px-4 font-semibold">Customer</th>
                  <th className="py-4 px-4 font-semibold">Destination</th>
                  <th className="py-4 px-4 font-semibold text-center">Status</th>
                  <th className="py-4 px-4 font-semibold text-right">Waybill</th>
                </tr>
              </thead>
              <tbody>
                {currentList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs font-semibold text-[#B37943] font-sans uppercase tracking-widest">No orders found</td>
                  </tr>
                )}
                {currentList.map(o => (
                  <tr key={o.id} className="border-b border-[#FAF3E8] hover:bg-[#FAF9F6]/30 text-xs text-[#4A3525] transition-colors">
                    <td className="py-4 px-5 text-center">
                      <input type="checkbox" checked={selectedOrderIds.includes(o.id)} onChange={() => toggleOrder(o.id)} className="rounded border-[#E5C492] text-[#4A3525] focus:ring-[#4A3525] cursor-pointer" />
                    </td>
                    <td className="py-4 px-4 font-bold">{o.order_number}</td>
                    <td className="py-4 px-4">
                      <div className="font-semibold">{o.customer_name}</div>
                      <div className="text-[10px] text-[#B37943]">{o.customer_phone}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="truncate max-w-[220px] font-medium">{o.address}</div>
                      <div className="text-[10px] text-[#B37943]">{o.city}, {o.state} - <strong>{o.pincode}</strong></div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full font-bold text-[9px] tracking-wider uppercase border ${
                        o.status === 'Packed' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        o.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        o.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' :
                        'bg-gray-50 text-gray-700 border-gray-100'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {o.shipments?.[0]?.waybill ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-[9px] text-[#B37943] font-bold">AWB: {o.shipments[0].waybill}</span>
                          <a href={`/api/dispatch/labels?waybills=${o.shipments[0].waybill}`} target="_blank" className="text-[9px] text-[#4A3525] hover:text-[#B37943] uppercase tracking-widest font-bold underline">Download</a>
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-400 font-sans uppercase tracking-widest">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pickup Modal */}
      {showPickupModal && (
        <div className="fixed inset-0 bg-[#4A3525]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-[#E5C492] animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-[#FAF9F6] border-b border-[#E5C492] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FAF3E8] rounded-full flex items-center justify-center text-[#B37943]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-[#4A3525] text-xl font-bold">Schedule Pickup</h3>
                  <p className="text-[10px] uppercase tracking-widest font-sans font-bold text-[#B37943]">Delhivery Courier</p>
                </div>
              </div>
              <button onClick={() => setShowPickupModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                <X className="w-5 h-5 text-[#4A3525]" />
              </button>
            </div>
            <form onSubmit={handlePickup} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest font-sans text-[#7B6856]">Expected Packages</label>
                <div className="relative">
                  <Package className="absolute left-3 top-3 w-4 h-4 text-[#B37943]" />
                  <input
                    type="number"
                    min="1"
                    value={expectedPkgCount}
                    onChange={(e) => setExpectedPkgCount(parseInt(e.target.value) || 1)}
                    className="w-full h-10 pl-10 pr-4 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-sm font-semibold text-[#4A3525] focus:outline-none focus:border-[#4A3525] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-[#B37943]">Currently waiting: {awaitingOrders.length}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest font-sans text-[#7B6856]">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-[#B37943]" />
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs font-semibold text-[#4A3525] focus:outline-none focus:border-[#4A3525] transition-colors cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest font-sans text-[#7B6856]">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-[#B37943]" />
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full h-10 pl-10 pr-8 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs font-semibold text-[#4A3525] focus:outline-none focus:border-[#4A3525] transition-colors cursor-pointer appearance-none"
                    >
                      <option value="10:00:00">10:00 AM</option>
                      <option value="12:00:00">12:00 PM</option>
                      <option value="14:00:00">02:00 PM</option>
                      <option value="16:00:00">04:00 PM</option>
                      <option value="18:00:00">06:00 PM</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-3 h-3 text-[#B37943] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={schedulePickupMutation.isPending}
                  className="w-full h-11 bg-[#4A3525] text-white rounded-xl text-xs font-bold uppercase tracking-widest font-sans hover:bg-[#32241b] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {schedulePickupMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Schedule Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

