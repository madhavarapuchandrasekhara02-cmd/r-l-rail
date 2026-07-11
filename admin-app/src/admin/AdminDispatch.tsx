"use client";
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { trpc } from '@/providers/trpc'
import { getPackedWeight } from '@/lib/weight'
import { generateAlternativeCourierPDF } from '@/lib/alternative_pdf'
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
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')

  // Alternative Courier states
  const [showAltDropdown, setShowAltDropdown] = useState(false)
  const [showPrintRangeModal, setShowPrintRangeModal] = useState(false)
  const [rangeModalTab, setRangeModalTab] = useState<'date' | 'order'>('date')
  const [rangeModalFromDate, setRangeModalFromDate] = useState('')
  const [rangeModalToDate, setRangeModalToDate] = useState('')
  const [rangeModalFromId, setRangeModalFromId] = useState('')
  const [rangeModalToId, setRangeModalToId] = useState('')

  // Manual dispatch modal states
  const [showManualDispatchModal, setShowManualDispatchModal] = useState(false)
  const [manualDispatchOrderId, setManualDispatchOrderId] = useState<string | null>(null)
  const [manualDispatchOrderNumber, setManualDispatchOrderNumber] = useState<string | null>(null)
  const [manualDispatchTracking, setManualDispatchTracking] = useState('')

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

  const handleApplyRangeSelect = () => {
    if (!rangeFrom && !rangeTo) return;
    
    const fromNum = parseInt(rangeFrom.replace(/[^0-9]/g, ''), 10)
    const toNum = parseInt(rangeTo.replace(/[^0-9]/g, ''), 10)

    if (isNaN(fromNum) || isNaN(toNum)) {
      toast.error('Please enter valid numeric order numbers (e.g. 52 to 55)')
      return
    }

    const start = Math.min(fromNum, toNum)
    const end = Math.max(fromNum, toNum)

    const matches = currentList.filter(o => {
      const oNum = parseInt(o.order_number?.replace(/[^0-9]/g, '') || '0', 10)
      return oNum >= start && oNum <= end
    })

    if (matches.length === 0) {
      toast.error(`No orders found in range RAL-${start} to RAL-${end}`)
      return
    }

    setSelectedOrderIds(matches.map(o => o.id))
    toast.success(`Selected ${matches.length} orders in range RAL-${start} to RAL-${end}`)
  }

  const handleClearRangeSelect = () => {
    setRangeFrom('')
    setRangeTo('')
    setSelectedOrderIds([])
  }

  // Auto-select range in real time when input values are provided
  useEffect(() => {
    if (!rangeFrom && !rangeTo) return

    const fromNum = parseInt(rangeFrom.replace(/[^0-9]/g, ''), 10)
    const toNum = parseInt(rangeTo.replace(/[^0-9]/g, ''), 10)

    if (isNaN(fromNum) || isNaN(toNum)) return

    const start = Math.min(fromNum, toNum)
    const end = Math.max(fromNum, toNum)

    const matches = currentList.filter(o => {
      const oNum = parseInt(o.order_number?.replace(/[^0-9]/g, '') || '0', 10)
      return oNum >= start && oNum <= end
    })

    setSelectedOrderIds(matches.map(o => o.id))
  }, [rangeFrom, rangeTo, currentList])

  // Helper to securely trigger PDF downloads bypassing popup blockers & cookie limits on mobile
  const triggerLabelDownload = async (waybills: string[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      
      const CHUNK_SIZE = 20
      for (let i = 0; i < waybills.length; i += CHUNK_SIZE) {
        const chunk = waybills.slice(i, i + CHUNK_SIZE)
        const url = `/api/dispatch/labels?waybills=${chunk.join(',')}&token=${encodeURIComponent(token)}`
        window.open(url, '_blank')
      }
    } catch (err) {
      console.error('Error triggering download:', err)
      toast.error('Failed to prepare label download')
    }
  }

  const dispatchViaManualCourierMutation = trpc.dispatch.dispatchViaManualCourier.useMutation()

  const handleAssignToManual = (orderId: string, orderNumber: string) => {
    setManualDispatchOrderId(orderId)
    setManualDispatchOrderNumber(orderNumber)
    setManualDispatchTracking('')
    setShowManualDispatchModal(true)
  }

  const handleConfirmManualDispatch = async () => {
    if (!manualDispatchOrderId || !manualDispatchOrderNumber) return

    const loadingToastId = toast.loading(`Dispatching ${manualDispatchOrderNumber} via manual courier...`)
    try {
      const res = await dispatchViaManualCourierMutation.mutateAsync({ 
        orderId: manualDispatchOrderId, 
        waybill: manualDispatchTracking.trim() || undefined 
      })
      loadData()
      setShowManualDispatchModal(false)
      if (res.success) {
        toast.success(`Dispatched via manual courier with waybill: ${res.waybill}`, { id: loadingToastId })
      } else {
        toast.error(res.error || 'Failed to dispatch', { id: loadingToastId })
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch', { id: loadingToastId })
    }
  }

  const handlePrintUnserviceablePDF = () => {
    const unserviceable = actionOrders.filter(o => o.shipments?.[0]?.waybill === 'UNSERVICEABLE')
    if (unserviceable.length === 0) {
      toast.error('No unserviceable orders found.')
      return
    }
    const doc = generateAlternativeCourierPDF(unserviceable)
    doc.save(`unserviceable-orders-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success(`Downloaded layout sheet for ${unserviceable.length} unserviceable orders!`)
  }

  const handleDownloadRangePDF = () => {
    let matches: any[] = []

    if (rangeModalTab === 'date') {
      if (!rangeModalFromDate || !rangeModalToDate) {
        toast.error("Please enter both start and end dates.")
        return
      }

      const start = new Date(rangeModalFromDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(rangeModalToDate)
      end.setHours(23, 59, 59, 999)

      matches = actionOrders.filter(o => {
        const oDate = new Date(o.created_at)
        return oDate >= start && oDate <= end
      })

      if (matches.length === 0) {
        toast.error("No paid orders found within selected date span.")
        return
      }
    } else {
      if (!rangeModalFromId || !rangeModalToId) {
        toast.error("Please enter both from and to Order IDs.")
        return
      }

      const start = Math.min(parseInt(rangeModalFromId, 10), parseInt(rangeModalToId, 10))
      const end = Math.max(parseInt(rangeModalFromId, 10), parseInt(rangeModalToId, 10))

      if (isNaN(start) || isNaN(end)) {
        toast.error("Invalid range numbers entered.")
        return
      }

      matches = actionOrders.filter(o => {
        const oNum = parseInt(o.order_number?.replace(/[^0-9]/g, '') || '0', 10)
        return oNum >= start && oNum <= end
      })

      if (matches.length === 0) {
        toast.error(`No paid orders found in range ${start} to ${end}.`)
        return
      }
    }

    const doc = generateAlternativeCourierPDF(matches)
    doc.save(`courier-export-${rangeModalTab}-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success(`Downloaded alternative shipping sheet for ${matches.length} orders!`)
    setShowPrintRangeModal(false)
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
          triggerLabelDownload(res.waybills)
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
      triggerLabelDownload(waybills)
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

      {/* Tabs & Alternative Courier Dropdown Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-2">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 flex-1 w-full">
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

        {/* Alternative Courier Dropdown */}
        <div className="relative shrink-0 self-end lg:self-center w-full lg:w-auto">
          <button 
            onClick={() => setShowAltDropdown(!showAltDropdown)}
            className="w-full lg:w-auto h-10 px-4 bg-white border border-[#E5C492] hover:bg-[#FAF9F6] text-[#4A3525] rounded-2xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center justify-between lg:justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            Alternative Courier
            <span className={`transition-transform duration-200 ${showAltDropdown ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {showAltDropdown && (
            <div className="absolute right-0 mt-2 w-full lg:w-48 bg-white border border-[#E5C492] rounded-2xl shadow-xl z-30 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  handlePrintUnserviceablePDF()
                  setShowAltDropdown(false)
                }}
                className="w-full text-left px-4 py-2.5 text-[10px] font-sans font-bold uppercase tracking-wider text-[#4A3525] hover:bg-[#FAF3E8]/50 transition-colors cursor-pointer"
              >
                Print Unserviceable
              </button>
              <button
                onClick={() => {
                  setShowPrintRangeModal(true)
                  setShowAltDropdown(false)
                }}
                className="w-full text-left px-4 py-2.5 text-[10px] font-sans font-bold uppercase tracking-wider text-[#4A3525] hover:bg-[#FAF3E8]/50 transition-colors border-t border-[#FAF3E8] cursor-pointer"
              >
                Print Range
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Courier Serviceability Warnings */}
      {shipmentResults?.errors && shipmentResults.errors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4 text-rose-700 relative">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" /> Courier Serviceability Warnings ({shipmentResults.errors.length})
            </h4>
            <button 
              onClick={() => setShipmentResults(null)}
              className="text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-700 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <ul className="space-y-1.5 text-[10px] font-sans font-semibold list-disc list-inside">
            {shipmentResults.errors.map((err: any, idx: number) => (
              <li key={idx}>
                {err.orderNumber ? (
                  <>
                    <span className="font-bold text-rose-800">{err.orderNumber}</span>: {err.reason} — <span className="italic text-[9px] text-rose-500">Please use another courier service.</span>
                  </>
                ) : (
                  err.reason
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-3 md:p-4 rounded-2xl border border-[#E5C492] shadow-sm sticky top-4 z-20 gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={selectedOrderIds.length > 0 && selectedOrderIds.length === currentList.length} onChange={toggleAll} className="rounded border-[#E5C492] text-[#4A3525] focus:ring-[#4A3525] cursor-pointer w-4 h-4" />
              <span className="text-xs font-bold text-[#4A3525] uppercase tracking-widest font-sans">{selectedOrderIds.length} Selected</span>
            </div>
            
            {(rangeFrom || rangeTo) && (
              <button 
                onClick={handleClearRangeSelect}
                className="h-8 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer border border-rose-100 sm:hidden"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-[#E5C492]/60 pt-3 sm:pt-0 sm:pl-4 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest font-sans shrink-0">Range:</span>
            <input 
              type="number" 
              placeholder="" 
              value={rangeFrom} 
              onChange={e => setRangeFrom(e.target.value)} 
              className="w-16 h-8 px-2 bg-[#FAF9F6] border border-[#E5C492] rounded-lg text-xs outline-none text-[#4A3525] font-semibold text-center"
            />
            <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest font-sans shrink-0">to</span>
            <input 
              type="number" 
              placeholder="" 
              value={rangeTo} 
              onChange={e => setRangeTo(e.target.value)} 
              className="w-16 h-8 px-2 bg-[#FAF9F6] border border-[#E5C492] rounded-lg text-xs outline-none text-[#4A3525] font-semibold text-center"
            />
            {(rangeFrom || rangeTo) && (
              <button 
                onClick={handleClearRangeSelect}
                className="h-8 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer border border-rose-100 hidden sm:block"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
          {activeTab === 'action' && (
            <button
              onClick={handleGenerateLabels}
              disabled={selectedOrderIds.length === 0 || generateLabelsMutation.isPending}
              className="h-9 px-4 bg-[#4A3525] text-white hover:bg-[#32241b] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.98] flex-1 sm:flex-none justify-center"
            >
              {generateLabelsMutation.isPending ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              Generate Labels
            </button>
          )}
          {activeTab === 'awaiting' && (
            <button
              onClick={handleDispatch}
              disabled={selectedOrderIds.length === 0 || dispatchOrdersMutation.isPending}
              className="h-9 px-4 bg-[#B37943] text-white hover:bg-[#96612F] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.98] flex-1 sm:flex-none justify-center"
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
              className="h-9 px-4 bg-white border border-[#E5C492] text-[#4A3525] hover:bg-[#FAF3E8] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-[0.98] flex-1 sm:flex-none justify-center"
            >
              <Calendar className="w-3.5 h-3.5 text-[#B37943]" /> Schedule Pickup
            </button>
          )}
          
          <button
            onClick={handlePrintSelected}
            disabled={selectedOrderIds.length === 0}
            className="h-9 px-4 bg-white border border-[#E5C492] text-[#4A3525] hover:bg-[#FAF3E8] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.98] flex-1 sm:flex-none justify-center"
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
              <div 
                key={o.id} 
                onClick={() => toggleOrder(o.id)}
                className={`p-3 sm:p-4 flex items-start gap-3 hover:bg-[#FAF9F6]/20 transition-colors cursor-pointer border ${o.shipments?.[0]?.waybill === 'UNSERVICEABLE' ? 'border-rose-400 bg-rose-50/20' : 'border-transparent'} ${selectedOrderIds.includes(o.id) ? 'bg-[#FAF3E8]/35' : ''}`}
              >
                <input 
                  type="checkbox" 
                  checked={selectedOrderIds.includes(o.id)} 
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleOrder(o.id);
                  }} 
                  className="mt-1 rounded border-[#E5C492] text-[#4A3525] focus:ring-[#4A3525] cursor-pointer shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#4A3525] truncate">{o.order_number}</span>
                    <span className="text-[9px] font-bold font-sans uppercase tracking-widest text-[#B37943] shrink-0">{o.status}</span>
                  </div>
                  <div className="text-[10px] text-[#4A3525] font-semibold mt-1 truncate">{o.customer_name}</div>
                  <div className="text-[10px] text-[#7B6856] mt-0.5 break-words whitespace-normal leading-relaxed">{o.address}, {o.city} - {o.pincode}</div>
                  {o.shipments?.[0]?.waybill && (
                    <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                      <div className={`text-[9px] font-mono font-bold px-2 py-1 rounded-lg border ${o.shipments[0].waybill === 'UNSERVICEABLE' ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-[#FAF9F6] border-[#E5C492] text-[#B37943]'}`}>
                        {o.shipments[0].waybill === 'UNSERVICEABLE' ? '⚠️ UNSERVICEABLE' : `AWB: ${o.shipments[0].waybill}`}
                      </div>
                      {o.shipments[0].waybill === 'UNSERVICEABLE' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAssignToManual(o.id, o.order_number) }}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-sans font-bold uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1 shrink-0 ml-auto"
                        >
                          Dispatch (Manual)
                        </button>
                      )}
                    </div>
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
                  <tr key={o.id} className={`border-b border-[#FAF3E8] hover:bg-[#FAF9F6]/30 text-xs text-[#4A3525] transition-colors ${o.shipments?.[0]?.waybill === 'UNSERVICEABLE' ? 'bg-rose-50/20' : ''}`}>
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
                          {o.shipments[0].waybill === 'UNSERVICEABLE' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-1 rounded border bg-rose-50 border-rose-100 text-rose-700">⚠️ Unserviceable</span>
                              <button
                                onClick={() => handleAssignToManual(o.id, o.order_number)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-sans font-bold uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1"
                              >
                                Dispatch (Manual)
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-mono text-[9px] text-[#B37943] font-bold">AWB: {o.shipments[0].waybill}</span>
                              <button onClick={() => triggerLabelDownload([o.shipments[0].waybill])} className="text-[9px] text-[#4A3525] hover:text-[#B37943] uppercase tracking-widest font-bold underline cursor-pointer">Download</button>
                            </>
                          )}
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

      {/* Print Range Modal */}
      {showPrintRangeModal && (
        <div className="fixed inset-0 bg-[#4A3525]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-[#E5C492] animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-[#FAF9F6] border-b border-[#E5C492] flex items-center justify-between">
              <h3 className="font-serif text-[#4A3525] text-lg font-bold">Print Custom Range</h3>
              <button 
                onClick={() => setShowPrintRangeModal(false)} 
                className="p-1.5 hover:bg-white rounded-xl transition-colors cursor-pointer text-[#4A3525]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Tab selector */}
              <div className="flex bg-[#FAF3E8]/50 p-1 rounded-xl border border-[#E5C492]/40">
                <button
                  onClick={() => setRangeModalTab('date')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    rangeModalTab === 'date' 
                      ? 'bg-[#4A3525] text-white shadow-sm' 
                      : 'text-[#B37943] hover:text-[#4A3525]'
                  }`}
                >
                  Date Span
                </button>
                <button
                  onClick={() => setRangeModalTab('order')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    rangeModalTab === 'order' 
                      ? 'bg-[#4A3525] text-white shadow-sm' 
                      : 'text-[#B37943] hover:text-[#4A3525]'
                  }`}
                >
                  Order Range
                </button>
              </div>

              {/* Form fields based on active tab */}
              {rangeModalTab === 'date' ? (
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest font-sans">Date Span:</span>
                    <input
                      type="date"
                      value={rangeModalFromDate}
                      onChange={e => setRangeModalFromDate(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs outline-none text-[#4A3525] font-semibold"
                    />
                  </div>
                  <div className="text-center text-[10px] font-bold text-[#B37943] uppercase tracking-widest font-sans">to</div>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="date"
                      value={rangeModalToDate}
                      onChange={e => setRangeModalToDate(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs outline-none text-[#4A3525] font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest font-sans">Order Range:</span>
                    <input
                      type="number"
                      placeholder="e.g. 54"
                      value={rangeModalFromId}
                      onChange={e => setRangeModalFromId(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs outline-none text-[#4A3525] font-semibold text-center"
                    />
                  </div>
                  <div className="text-center text-[10px] font-bold text-[#B37943] uppercase tracking-widest font-sans">to</div>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="number"
                      placeholder="e.g. 65"
                      value={rangeModalToId}
                      onChange={e => setRangeModalToId(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs outline-none text-[#4A3525] font-semibold text-center"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 pt-3 border-t border-[#FAF3E8]">
                <button
                  onClick={() => setShowPrintRangeModal(false)}
                  className="flex-1 h-10 bg-white border border-[#E5C492] text-[#4A3525] hover:bg-[#FAF9F6] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadRangePDF}
                  className="flex-1 h-10 bg-[#4A3525] text-white hover:bg-[#32241b] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Dispatch Modal */}
      {showManualDispatchModal && (
        <div className="fixed inset-0 bg-[#4A3525]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-[#E5C492] animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-[#FAF9F6] border-b border-[#E5C492] flex items-center justify-between">
              <h3 className="font-serif text-[#4A3525] text-lg font-bold">Manual Dispatch</h3>
              <button 
                onClick={() => setShowManualDispatchModal(false)} 
                className="p-1.5 hover:bg-white rounded-xl transition-colors cursor-pointer text-[#4A3525]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#8B7355] leading-relaxed">
                Enter the tracking number for order <strong className="text-[#4A3525]">{manualDispatchOrderNumber}</strong>. Leave blank to generate a default manual dispatch code.
              </p>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest font-sans">Tracking Number:</span>
                <input
                  type="text"
                  placeholder="e.g. DTDC12345678"
                  value={manualDispatchTracking}
                  onChange={e => setManualDispatchTracking(e.target.value)}
                  className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs outline-none text-[#4A3525] font-semibold"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-3 border-t border-[#FAF3E8]">
                <button
                  onClick={() => setShowManualDispatchModal(false)}
                  className="flex-1 h-10 bg-white border border-[#E5C492] text-[#4A3525] hover:bg-[#FAF9F6] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmManualDispatch}
                  className="flex-1 h-10 bg-[#4A3525] text-white hover:bg-[#32241b] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
                >
                  Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

