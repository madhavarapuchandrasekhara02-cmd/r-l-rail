import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { trpc } from '@/providers/trpc'
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
  X
} from 'lucide-react'

export default function AdminDispatch() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [shipments, setShipments] = useState<any[]>([])
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPrepSummary, setShowPrepSummary] = useState(true)
  const [showAlerts, setShowAlerts] = useState(false)
  const [showPickupModal, setShowPickupModal] = useState(false)

  // Pickup form
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [pickupTime, setPickupTime] = useState('14:00:00')
  const [expectedPkgCount, setExpectedPkgCount] = useState(1)
  const [scheduling, setScheduling] = useState(false)

  const shipOrdersMutation = trpc.dispatch.shipOrders.useMutation()
  const getPackslipMutation = trpc.dispatch.getPackslipUrl.useMutation()
  const schedulePickupMutation = trpc.dispatch.schedulePickup.useMutation()
  const getWaybillsMutation = trpc.dispatch.getWaybills.useMutation()

  useEffect(() => { loadData() }, [startDate, endDate])

  async function loadData() {
    setLoading(true)
    try {
      let q = supabase
        .from('orders')
        .select('*, order_items(*), shipments(*)')
        .order('created_at', { ascending: false })

      if (startDate) q = q.gte('created_at', new Date(startDate).toISOString())
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        q = q.lte('created_at', end.toISOString())
      }

      const { data: orderData } = await q
      setOrders(orderData || [])

      const { data: shipData } = await supabase
        .from('shipments')
        .select('*, orders(*)')
        .order('created_at', { ascending: false })
      setShipments(shipData || [])
    } catch (err: any) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Unshipped paid orders
  const readyOrders = useMemo(() => {
    return orders.filter(o => {
      const isReady = o.status === 'Paid' || o.status === 'Pending'
      const hasNoShipment = !o.shipments || o.shipments.length === 0
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.order_number?.toLowerCase().includes(q) ||
        o.pincode?.includes(q) ||
        o.customer_phone?.includes(q)
      return isReady && hasNoShipment && matchesSearch
    })
  }, [orders, searchQuery])

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const shippedToday = orders.filter(o => o.status === 'Shipped' && new Date(o.updated_at || o.created_at).toDateString() === today).length
    const delivered = orders.filter(o => o.status === 'Delivered').length
    return { ready: readyOrders.length, shippedToday, delivered }
  }, [orders, readyOrders])

  // Exception shipments
  const exceptionShipments = useMemo(() => {
    return shipments.filter(s => {
      const status = (s.tracking_status || '').toLowerCase()
      const isException =
        status.includes('undelivered') ||
        status.includes('rto') ||
        status.includes('failed') ||
        status.includes('hold') ||
        status.includes('returned') ||
        status.includes('exception')
      const isStuck = s.shipped_at &&
        (Date.now() - new Date(s.shipped_at).getTime()) > 3 * 24 * 60 * 60 * 1000 &&
        status !== 'delivered' && status !== 'cancelled'
      return isException || isStuck
    })
  }, [shipments])

  // Kitchen prep summary
  const prepList = useMemo(() => {
    const target = selectedOrderIds.length > 0
      ? orders.filter(o => selectedOrderIds.includes(o.id))
      : readyOrders

    const map: Record<string, { name: string; variant: string; qty: number; weight: number }> = {}
    target.forEach(order => {
      (order.order_items || []).forEach((item: any) => {
        const key = `${item.product_name}-${item.variant_label}`
        const qty = item.quantity || 1
        const v = (item.variant_label || '').toLowerCase()
        let w = 0.25
        if (v.includes('100ml') || v.includes('100g')) w = 0.15
        else if (v.includes('200ml') || v.includes('250ml') || v.includes('200g') || v.includes('250g')) w = 0.3
        else if (v.includes('500ml') || v.includes('500g')) w = 0.6

        if (map[key]) { map[key].qty += qty; map[key].weight += w * qty }
        else { map[key] = { name: item.product_name, variant: item.variant_label, qty, weight: w * qty } }
      })
    })
    return Object.values(map).sort((a, b) => b.qty - a.qty)
  }, [selectedOrderIds, readyOrders, orders])

  const toggleOrder = (id: string) => {
    setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const toggleAll = () => {
    setSelectedOrderIds(prev => prev.length === readyOrders.length ? [] : readyOrders.map(o => o.id))
  }

  // Ship selected orders
  const handleShip = async () => {
    if (selectedOrderIds.length === 0) { toast.error('Select orders to ship'); return }

    toast.promise(
      shipOrdersMutation.mutateAsync({ orderIds: selectedOrderIds }),
      {
        loading: `Registering ${selectedOrderIds.length} parcels with Delhivery...`,
        success: (res) => {
          loadData()
          setSelectedOrderIds([])
          if (!res.success && res.errors?.length) {
            return res.errors[0]?.reason || 'Shipment failed'
          }
          if (res.errors?.length) {
            return `Shipped ${res.packages?.length || 0} orders. ${res.errors.length} failed.`
          }
          return `Successfully shipped ${res.packages?.length || 0} orders!`
        },
        error: (err) => err.message || 'Failed to ship orders',
      }
    )
  }

  // Print labels for shipped orders
  const handlePrintLabels = async () => {
    let waybillsToPrint: string[] = []
    
    try {
      if (selectedOrderIds.length > 0) {
        waybillsToPrint = await getWaybillsMutation.mutateAsync({ orderIds: selectedOrderIds })
      } else {
        waybillsToPrint = await getWaybillsMutation.mutateAsync({})
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch waybills')
      return
    }

    if (!waybillsToPrint || waybillsToPrint.length === 0) {
      // Fallback: open custom batch label page
      toast.error('No waybills found. Ship orders first.')
      return
    }

    // Try to get official Delhivery label URL
    try {
      // Use server-side proxy route to avoid leaking API token
      const labelUrl = `/api/dispatch/labels?waybills=${waybillsToPrint.join(',')}`
      window.open(labelUrl, '_blank')
      toast.success(`Downloading ${waybillsToPrint.length} Delhivery labels...`)
    } catch {
      // Fallback to custom labels
      window.open(`/admin/label/batch?waybills=${waybillsToPrint.join(',')}`, '_blank')
      toast.success(`Opening ${waybillsToPrint.length} custom labels...`)
    }
  }

  // Schedule pickup
  const handlePickup = async (e: React.FormEvent) => {
    e.preventDefault()
    setScheduling(true)
    try {
      const res = await schedulePickupMutation.mutateAsync({
        expectedPackageCount: expectedPkgCount,
        pickupDate,
        pickupTime,
        pickupLocation: 'Gajuwaka',
      })
      if (res.success) {
        toast.success('Pickup scheduled successfully!')
        setShowPickupModal(false)
      } else {
        toast.error(res.error || 'Failed to schedule pickup')
      }
    } catch (err: any) {
      toast.error(err.message || 'Pickup scheduling failed')
    } finally {
      setScheduling(false)
    }
  }

  // Generate Dispatch PDF
  const handleGeneratePDF = () => {
    if (orders.length === 0) {
      toast.error('No orders found in the selected date range')
      return
    }

    const doc = new jsPDF()
    const margin = 15
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const colWidth = (pageWidth - margin * 3) / 2
    
    let yLeft = margin
    let yRight = margin

    const sortedOrders = [...orders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    sortedOrders.forEach((order, index) => {
      const isLeft = index % 2 === 0
      const x = isLeft ? margin : margin * 2 + colWidth
      let y = isLeft ? yLeft : yRight

      const drawBlock = (dryRun = false) => {
        let blockY = y
        const addLine = (text: string, isBold = false, indent = 0) => {
           if (!dryRun) {
             doc.setFont('helvetica', isBold ? 'bold' : 'normal')
             doc.text(text, x + indent, blockY)
           }
           blockY += 6
        }
        
        const addWrappedText = (text: string, isBold = false, indent = 0) => {
           if (!dryRun) doc.setFont('helvetica', isBold ? 'bold' : 'normal')
           const lines = doc.splitTextToSize(text, colWidth - indent)
           if (!dryRun) {
             doc.text(lines, x + indent, blockY)
           }
           blockY += lines.length * 6
        }

        doc.setFontSize(10)
        addLine(`Order ID: ${order.order_number || order.id}`, true)
        blockY += 2
        addLine(`Customer: ${order.customer_name || ''}`)
        blockY += 2
        addLine(`Mobile: ${order.customer_phone || ''}`)
        blockY += 2
        
        const fullAddress = `address: ${order.address || ''}, ${order.city || ''}, ${order.state || ''}, Pincode: ${order.pincode || ''}`
        addWrappedText(fullAddress)
        
        blockY += 2
        addLine(`items :`)
        blockY += 2
        
        const items = order.order_items || []
        items.forEach((item: any) => {
          const itemText = `• ${item.product_name} (${item.variant_label}) x ${item.quantity}`
          addWrappedText(itemText, false, 5)
        })
        
        blockY += 5
        if (!dryRun) {
          doc.setDrawColor(200)
          doc.setLineWidth(0.5)
          doc.line(x, blockY, x + colWidth, blockY)
        }
        blockY += 8
        return blockY
      }

      let nextY = drawBlock(true)
      if (nextY > pageHeight - margin) {
        doc.addPage()
        yLeft = margin
        yRight = margin
        y = margin
      }

      const finalY = drawBlock(false)
      
      if (isLeft) {
        yLeft = finalY
      } else {
        yRight = finalY
      }
      if (isLeft) {
        yLeft = finalY
      } else {
        yRight = finalY
      }
    })

    const formatDate = (dateStr: string) => {
      if (!dateStr) return 'All'
      const parts = dateStr.split('-')
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
      return dateStr
    }

    const safeStart = formatDate(startDate)
    const safeEnd = formatDate(endDate)
    doc.save(`Dispatch_Orders_${safeStart}_to_${safeEnd}.pdf`)
    toast.success(`Generated PDF for ${orders.length} orders`)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-6xl mx-auto selection:bg-[#B37943]/20 selection:text-[#B37943]">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#B37943] text-xs font-bold uppercase tracking-[0.22em] font-sans">
            <Truck className="w-3.5 h-3.5" /> Shipping Operations
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#4A3525] font-semibold">Shipping Center</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-[#E5C492] rounded-xl px-2 h-10 shadow-sm text-xs font-serif font-semibold text-[#4A3525]">
            <span className="px-1.5 text-[#B37943] uppercase text-[9px] tracking-widest font-sans font-bold">From</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent focus:outline-none w-28 text-center" />
            <span className="px-1.5 text-[#B37943] uppercase text-[9px] tracking-widest font-sans font-bold border-l border-[#E5C492]/30">To</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent focus:outline-none w-28 text-center" />
          </div>
          <button onClick={loadData} className="w-10 h-10 bg-white border border-[#E5C492] hover:bg-[#FAF3E8] rounded-xl flex items-center justify-center text-[#B37943] active:scale-[0.98] transition-all shadow-sm cursor-pointer" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#E5C492]/80 p-4 md:p-5 shadow-sm">
          <span className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest font-sans">Ready to ship</span>
          <div className="text-2xl md:text-3xl font-serif font-bold text-[#4A3525] mt-1">{stats.ready}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5C492]/80 p-4 md:p-5 shadow-sm">
          <span className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest font-sans">Shipped today</span>
          <div className="text-2xl md:text-3xl font-serif font-bold text-[#4A3525] mt-1">{stats.shippedToday}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5C492]/80 p-4 md:p-5 shadow-sm">
          <span className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest font-sans">Delivered</span>
          <div className="text-2xl md:text-3xl font-serif font-bold text-[#4A3525] mt-1">{stats.delivered}</div>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#B37943]">
          <Loader className="w-8 h-8 animate-spin mb-3" />
          <p className="text-xs uppercase tracking-widest font-bold font-sans">Loading shipping data...</p>
        </div>
      ) : (
        <>
          {/* Kitchen Prep Summary */}
          {prepList.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#E5C492] shadow-sm overflow-hidden">
              <button
                onClick={() => setShowPrepSummary(!showPrepSummary)}
                className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-[#B37943]" />
                  <h3 className="text-xs font-bold text-[#4A3525] uppercase tracking-[0.2em] font-sans">Preparation Summary</h3>
                  <span className="text-[10px] font-bold bg-[#FAF3E8] text-[#B37943] px-2.5 py-0.5 rounded-full font-sans">
                    {selectedOrderIds.length > 0 ? `${selectedOrderIds.length} selected` : `${readyOrders.length} orders`}
                  </span>
                </div>
                {showPrepSummary ? <ChevronUp className="w-4 h-4 text-[#B37943]" /> : <ChevronDown className="w-4 h-4 text-[#B37943]" />}
              </button>

              {showPrepSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 md:p-5 pt-0">
                  {prepList.map((item, idx) => (
                    <div key={idx} className="border border-[#E5C492]/60 bg-white rounded-xl p-4 flex flex-col justify-between hover:border-[#B37943]/60 transition-all">
                      <div>
                        <span className="text-[10px] font-serif font-bold text-[#4A3525] uppercase tracking-wider block truncate" title={item.name}>{item.name}</span>
                        <span className="text-[9px] text-[#B37943] uppercase tracking-widest font-sans font-semibold mt-0.5 block">{item.variant || 'Standard'}</span>
                      </div>
                      <div className="flex items-end justify-between mt-4">
                        <div>
                          <span className="text-2xl font-bold font-serif text-[#B37943]">{item.qty}</span>
                          <span className="text-[9px] font-bold text-[#4A3525] uppercase tracking-wider ml-1">Units</span>
                        </div>
                        <span className="text-[8px] font-sans font-extrabold uppercase tracking-widest text-[#7B6856]/60">
                          {item.weight.toFixed(1)} KG
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Search & Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 md:p-4 rounded-xl border border-[#E5C492] shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#B37943]" />
              <input
                type="text"
                placeholder="Search by name, order, phone, pincode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs outline-none focus:border-[#4A3525] text-[#4A3525]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleShip}
                disabled={selectedOrderIds.length === 0 || shipOrdersMutation.isPending}
                className="h-10 px-4 bg-[#4A3525] text-white hover:bg-[#32241b] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                {shipOrdersMutation.isPending ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Ship ({selectedOrderIds.length})
              </button>
              <button
                onClick={handlePrintLabels}
                className="h-10 px-4 bg-[#B37943] text-white hover:bg-[#96612F] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" /> Labels
              </button>
              <button
                onClick={handleGeneratePDF}
                className="h-10 px-4 bg-[#B37943] text-white hover:bg-[#96612F] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" /> Dispatch PDF
              </button>
              <button
                onClick={() => setShowPickupModal(true)}
                className="h-10 px-4 bg-white border border-[#E5C492] text-[#4A3525] hover:bg-[#FAF3E8] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <Clock className="w-3.5 h-3.5" /> Pickup
              </button>
            </div>
          </div>

          {/* Orders Table */}
          {readyOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-[#E5C492]/40 rounded-2xl text-center p-8">
              <CheckCircle2 className="w-12 h-12 text-[#B37943] mb-4 stroke-1" />
              <h3 className="text-lg font-serif text-[#4A3525] font-semibold mb-1">All Orders Shipped</h3>
              <p className="text-xs text-[#B37943]">No pending orders in the selected date range.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5C492] shadow-sm flex flex-col h-[600px] max-h-[60vh]">
              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-[#FAF3E8] overflow-y-auto flex-1">
                <div className="p-3 bg-[#FAF9F6] flex items-center gap-2 sticky top-0 z-10 border-b border-[#E5C492]">
                  <input type="checkbox" checked={selectedOrderIds.length === readyOrders.length} onChange={toggleAll} className="rounded border-[#E5C492] text-[#4A3525] focus:ring-[#4A3525] cursor-pointer shrink-0" />
                  <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest font-sans">Select All ({readyOrders.length})</span>
                </div>
                {readyOrders.map(o => (
                  <div key={o.id} className="p-4 flex items-start gap-3">
                    <input type="checkbox" checked={selectedOrderIds.includes(o.id)} onChange={() => toggleOrder(o.id)} className="mt-1 rounded border-[#E5C492] text-[#4A3525] focus:ring-[#4A3525] cursor-pointer shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#4A3525] truncate">{o.order_number}</span>
                        <span className="text-xs font-bold font-serif text-[#B37943] shrink-0">₹{o.total}</span>
                      </div>
                      <div className="text-[10px] text-[#4A3525] font-semibold mt-1 truncate">{o.customer_name}</div>
                      <div className="text-[10px] text-[#B37943] mt-0.5 truncate">{o.customer_phone}</div>
                      <div className="text-[10px] text-[#7B6856] mt-0.5 break-words whitespace-normal">{o.address}, {o.city} - {o.pincode}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Wrapper */}
              <div className="hidden md:block overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#FAF9F6] shadow-sm">
                    <tr className="border-b border-[#E5C492] text-[10px] uppercase font-sans tracking-widest text-[#B37943]">
                      <th className="py-4 px-5 w-12 text-center">
                        <input type="checkbox" checked={selectedOrderIds.length === readyOrders.length} onChange={toggleAll} className="rounded border-[#E5C492] text-[#4A3525] focus:ring-[#4A3525] cursor-pointer" />
                      </th>
                      <th className="py-4 px-4 font-semibold">Order</th>
                      <th className="py-4 px-4 font-semibold">Customer</th>
                      <th className="py-4 px-4 font-semibold">Destination</th>
                      <th className="py-4 px-4 font-semibold text-right">Value</th>
                      <th className="py-4 px-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readyOrders.map(o => (
                      <tr key={o.id} className="border-b border-[#FAF3E8] hover:bg-[#FAF9F6]/30 text-xs text-[#4A3525]">
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
                        <td className="py-4 px-4 text-right font-bold font-serif">₹{o.total}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-bold text-[9px] tracking-wider uppercase border border-green-100">{o.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delivery Alerts */}
          {exceptionShipments.length > 0 && (
            <section className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-red-50/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className="text-xs font-bold text-red-600 uppercase tracking-[0.2em] font-sans">Delivery Alerts</h3>
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-sans border border-red-100">{exceptionShipments.length}</span>
                </div>
                {showAlerts ? <ChevronUp className="w-4 h-4 text-red-400" /> : <ChevronDown className="w-4 h-4 text-red-400" />}
              </button>

              {showAlerts && (
                <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-3">
                  {exceptionShipments.map(s => (
                    <div key={s.id} className="bg-red-50/30 rounded-xl border border-red-100 p-4 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#4A3525]">{s.orders?.order_number}</span>
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-bold uppercase tracking-wider text-[8px] border border-red-100">{s.tracking_status}</span>
                      </div>
                      <div className="text-[10px] text-[#B37943]">{s.orders?.customer_name} | {s.orders?.city}</div>
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-red-100/50">
                        <span className="text-[9px] text-gray-400 font-mono">AWB: {s.waybill}</span>
                        <a href={`https://www.delhivery.com/track/package/${s.waybill}`} target="_blank" rel="noopener noreferrer" className="text-[9px] text-[#B37943] hover:underline font-bold uppercase tracking-wider">Track</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Pickup Scheduling Modal */}
      {showPickupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5C492] w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-[#FAF3E8]">
              <div>
                <h3 className="text-lg font-serif text-[#4A3525] font-semibold">Schedule Pickup</h3>
                <p className="text-[10px] text-[#B37943] font-sans mt-0.5">Request Delhivery courier to collect packages</p>
              </div>
              <button onClick={() => setShowPickupModal(false)} className="w-8 h-8 rounded-lg bg-[#FAF9F6] hover:bg-[#FAF3E8] flex items-center justify-center text-[#B37943] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePickup} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#4A3525] uppercase tracking-widest">Date</label>
                  <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full h-11 px-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4A3525] text-[#4A3525]" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#4A3525] uppercase tracking-widest">Time Slot</label>
                  <select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full h-11 px-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4A3525] text-[#4A3525]">
                    <option value="10:00:00">Morning (10 AM - 1 PM)</option>
                    <option value="14:00:00">Afternoon (2 - 5 PM)</option>
                    <option value="17:00:00">Evening (5 - 8 PM)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#4A3525] uppercase tracking-widest">Expected Packages</label>
                <input type="number" min="1" value={expectedPkgCount} onChange={e => setExpectedPkgCount(parseInt(e.target.value) || 1)} className="w-full h-11 px-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4A3525] text-[#4A3525]" required />
              </div>

              <button type="submit" disabled={scheduling} className="w-full h-12 bg-[#4A3525] text-white hover:bg-[#32241b] rounded-xl text-xs font-sans font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]">
                {scheduling ? <><Loader className="w-4 h-4 animate-spin" /> Scheduling...</> : <><Calendar className="w-4 h-4" /> Schedule Pickup</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
