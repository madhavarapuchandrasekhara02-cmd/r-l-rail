"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Truck, Eye, CheckCircle, Search, Filter, Calendar, MapPin, Phone, User, Package, ChevronRight, ChevronDown, ChevronUp, X, ExternalLink, MoreVertical, RefreshCw, AlertCircle, Printer } from 'lucide-react'
import { getPackedWeight, TARE_WEIGHT } from '@/lib/weight'

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Processing', label: 'Processing', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'Paid', label: 'Paid', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'Packed', label: 'Packed', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'Shipped', label: 'Shipped', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'In Transit', label: 'In Transit', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'Delivered', label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Cancelled', label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' },
]

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, startDate, endDate])

  // Helper to securely trigger PDF downloads bypassing popup blockers & cookie limits on mobile
  const triggerLabelDownload = async (waybills: string[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const downloadParam = isMobile ? '&download=true' : ''
      const url = `/api/dispatch/labels?waybills=${waybills.join(',')}&token=${encodeURIComponent(token)}${downloadParam}`
      
      if (isMobile) {
        window.location.href = url
      } else {
        window.open(url, '_blank')
      }
    } catch (err) {
      console.error('Error triggering download:', err)
    }
  }

  async function fetchOrders() {
    setLoading(true)
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(*), shipments(*)')
        .order('created_at', { ascending: false })

      if (statusFilter) query = query.eq('status', statusFilter)

      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString())
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query = query.lte('created_at', end.toISOString())
      }

      const { data, error } = await query
      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      
      if (error) throw error


      // Reload local state to synchronize
      await fetchOrders()

      // Update selectedOrder if it was active
      if (selectedOrder?.id === orderId) {
        const { data: updatedOrder, error: orderErr } = await supabase
          .from('orders')
          .select('*, order_items(*), shipments(*)')
          .eq('id', orderId)
          .maybeSingle()
        if (!orderErr && updatedOrder) {
          setSelectedOrder(updatedOrder)
        }
      }
    } catch (err) {
      console.error(err)
      alert('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = orders.filter(o => 
    o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer_phone?.includes(searchQuery)
  )

  // Filter for orders that need to be prepared (Paid)
  const prepOrders = filteredOrders.filter(o => o.status === 'Paid')

  // Group and count bottles across the prep orders
  const bottleAggregation = prepOrders.reduce((acc: {[key: string]: { count: number; weight: number }}, order) => {
    order.order_items?.forEach((item: any) => {
      const key = `${item.product_name} (${item.variant_label || 'Standard'})`
      
      // Calculate weight based on variant name or defaults
      const itemWeight = getPackedWeight(item.variant_label || '')
      
      const totalItemWeight = itemWeight * item.quantity
      
      if (!acc[key]) {
        acc[key] = { count: 0, weight: 0 }
      }
      acc[key].count += item.quantity
      acc[key].weight += totalItemWeight
    })
    return acc
  }, {})
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-10 px-4 sm:px-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-4 sm:mt-0">
        <div>
          <h1 className="text-3xl font-bold text-[#4A3525] mb-1">Order Management</h1>
          <p className="text-[#B37943] font-medium tracking-wide uppercase text-[10px]">
            Oversee fulfillment and track customer happiness
          </p>
        </div>
      </header>

      {/* Controls Bar: Calendar Filters & Batch Print */}
      <div className="bg-white border border-[#E5C492] rounded-2xl md:rounded-[2rem] p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#B37943]" />
            <span className="text-xs font-bold text-[#4A3525] uppercase tracking-wider">Date Span:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] items-stretch md:items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#FAF9F6] border border-[#E5C492] rounded-xl px-3 py-2 text-xs font-bold text-[#4A3525] focus:outline-none focus:ring-2 focus:ring-[#B37943]/20 cursor-pointer w-full text-center min-w-0"
            />
            <span className="text-xs text-[#B37943] font-bold px-1 text-center">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#FAF9F6] border border-[#E5C492] rounded-xl px-3 py-2 text-xs font-bold text-[#4A3525] focus:outline-none focus:ring-2 focus:ring-[#B37943]/20 cursor-pointer w-full text-center min-w-0"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                className="py-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest md:p-2"
                title="Clear Dates"
              >
                <X className="w-4 h-4" /> <span className="md:hidden">Clear Span</span>
              </button>
            )}
          </div>
        </div>
        

      </div>

      {/* Stock Prep Aggregator */}
      {filteredOrders.length > 0 && (
        <div className="bg-[#FAF9F6] border border-[#E5C492] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
          <div 
            className="flex items-center justify-between pb-2 sm:pb-3 cursor-pointer group select-none"
            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Package className="w-4 h-4 sm:w-5 h-5 text-[#B37943]" />
              <span className="text-[11px] sm:text-sm font-bold text-[#4A3525] uppercase tracking-wider font-sans group-hover:text-[#B37943] transition-colors">Kitchen & Stock Preparation Summary</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] sm:text-[10px] bg-[#B37943]/10 text-[#4A3525] font-extrabold uppercase px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-[#E5C492]">
                {prepOrders.length} Orders
              </span>
              <div className="text-[#B37943] group-hover:text-[#4A3525] transition-colors">
                {isSummaryOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </div>
          
          {isSummaryOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 pt-2 border-t border-[#E5C492]/50 animate-in fade-in slide-in-from-top-2 duration-300">
              {Object.entries(bottleAggregation).map(([key, data]: any) => (
                <div key={key} className="bg-white border border-[#E5C492] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <span className="text-[10px] sm:text-xs font-bold text-[#4A3525] leading-tight mb-1 sm:mb-2">{key}</span>
                  <div className="flex items-baseline justify-between mt-auto gap-1">
                    <span className="text-base sm:text-2xl font-black text-[#B37943]">{data.count} <span className="text-[9px] sm:text-xs font-bold text-[#4A3525]">Units</span></span>
                    <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase">Est: {((data.weight + TARE_WEIGHT) / 1000).toFixed(1)} Kg</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status Filter Bar */}
      <div className="bg-white border border-[#E5C492] p-1.5 rounded-2xl shadow-sm flex items-center justify-start md:justify-center gap-2 overflow-x-auto no-scrollbar w-full">
        <button 
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex-shrink-0 ${statusFilter === '' ? 'bg-[#4A3525] text-white shadow-lg' : 'text-[#B37943] hover:text-[#4A3525]'}`}
        >
          All Logs
        </button>
        {['Pending', 'Processing', 'Paid', 'Packed', 'Shipped', 'In Transit', 'Delivered', 'Cancelled'].map(status => (
          <button 
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex-shrink-0 ${statusFilter === status ? 'bg-[#4A3525] text-white shadow-lg' : 'text-[#B37943] hover:text-[#4A3525]'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#B37943] group-focus-within:text-[#4A3525] transition-colors" />
        <input
          type="text"
          placeholder="Search by order number, customer name, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-white border border-[#E5C492] rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-[#B37943]/5 transition-all shadow-sm"
        />
      </div>

      {/* Mobile Card View (hidden on lg) */}
      <div className="lg:hidden space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar pb-10">
        {loading ? (
          <div className="py-20 text-center">
             <div className="w-10 h-10 border-4 border-[#B37943] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
             <p className="text-[#B37943] font-medium">Fetching orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#E5C492]">
            <AlertCircle className="w-10 h-10 text-[#B37943] mx-auto mb-3 opacity-20" />
            <p className="text-lg font-bold text-[#4A3525]">No orders found</p>
            <p className="text-xs text-[#B37943]">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-[#E5C492] p-3 shadow-sm active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-sm font-bold text-[#4A3525]">{order.order_number}</h3>
                  <p className="text-[9px] text-[#B37943] uppercase font-bold tracking-tighter">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                   <select 
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    disabled={updatingId === order.id}
                    className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded border focus:outline-none appearance-none cursor-pointer text-center ${
                      STATUS_OPTIONS.find(s => s.value === order.status)?.color || 'bg-[#F0E6D9]'
                    }`}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-[#FAF9F6]">
                <div>
                  <p className="text-xs font-bold text-[#4A3525] truncate max-w-[150px]">{order.customer_name}</p>
                  <p className="text-[9px] text-[#B37943]">{order.customer_phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#4A3525]">₹{order.total}</span>
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 bg-[#FAF9F6] text-[#4A3525] rounded-lg border border-[#E5C492] hover:bg-[#E5C492] transition-colors flex items-center justify-center"
                    title="View Protocol"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (hidden on small screens) */}
      <div className="hidden lg:block bg-white rounded-[2rem] border border-[#E5C492] shadow-2xl shadow-[#4A3525]/5 overflow-hidden max-h-[800px] overflow-y-auto no-scrollbar">
        <div className="min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6]/50 border-b border-[#E5C492]">
                <th className="px-8 py-5 text-[10px] font-bold text-[#B37943] uppercase tracking-[0.2em]">Manifest ID</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[#B37943] uppercase tracking-[0.2em]">Customer</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[#B37943] uppercase tracking-[0.2em]">Transaction</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[#B37943] uppercase tracking-[0.2em]">Status Control</th>
                <th className="px-8 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF9F6]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="w-10 h-10 border-4 border-[#B37943] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#B37943] italic font-medium">Synchronizing with central archive...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <p className="text-xl font-bold text-[#4A3525] mb-1">Archive Empty</p>
                    <p className="text-xs text-[#B37943]">The current parameters yielded no records.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-[#FAF9F6]/30 transition-all duration-300">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#4A3525] group-hover:text-[#B37943] transition-colors">{order.order_number}</span>
                        <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#FAF9F6] rounded-xl flex items-center justify-center text-[#B37943] group-hover:scale-110 transition-transform">
                          <User className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#4A3525]">{order.customer_name}</span>
                          <span className="text-[10px] text-[#B37943]">{order.customer_phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-base font-bold text-[#4A3525]">₹{order.total}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="relative inline-block">
                        <select 
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border focus:outline-none appearance-none cursor-pointer hover:shadow-md transition-all pr-8 ${
                            STATUS_OPTIONS.find(s => s.value === order.status)?.color || 'bg-[#F0E6D9]'
                          }`}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50">
                           {updatingId === order.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3 rotate-90" />}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-3 bg-white text-[#B37943] hover:text-[#4A3525] border border-[#E5C492] rounded-2xl shadow-sm transition-all group-hover:bg-[#FAF9F6] group-hover:shadow-md hover:scale-110"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 lg:p-10">
          <div className="absolute inset-0 bg-[#4A3525]/60 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
          
          <div className="relative w-full max-w-4xl bg-[#FAF9F6] rounded-xl sm:rounded-[2.5rem] shadow-3xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-10 duration-500 border border-[#E5C492]">
            {/* Modal Header */}
            <div className="p-3 sm:p-8 pb-2 sm:pb-4 flex items-center justify-between border-b border-[#E5C492]">
              <div>
                <div className="flex items-center gap-3 sm:gap-4 mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#4A3525]">{selectedOrder.order_number}</h2>
                  <div className="relative">
                    <select 
                      value={selectedOrder.status}
                      onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                      className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg border focus:outline-none appearance-none cursor-pointer ${
                        STATUS_OPTIONS.find(s => s.value === selectedOrder.status)?.color || 'bg-white'
                      }`}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[9px] sm:text-[10px] text-[#B37943] font-bold tracking-widest uppercase">Logged: {new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center bg-white rounded-lg sm:rounded-2xl text-[#4A3525] border border-[#E5C492] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-8 space-y-4 sm:space-y-8">
              {/* Customer & Shipping Info */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                <div className="bg-white p-3 sm:p-7 rounded-xl sm:rounded-[2rem] border border-[#E5C492] space-y-3 sm:space-y-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-[#4A3525] uppercase tracking-[0.25em] flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#B37943]" /> Client Dossier
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FAF9F6] rounded-xl sm:rounded-2xl flex items-center justify-center text-[#B37943]">
                        <User className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#4A3525] truncate">{selectedOrder.customer_name}</p>
                        <p className="text-[10px] sm:text-xs text-[#B37943] font-medium truncate">{selectedOrder.customer_email || 'Archive Entry Missing'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FAF9F6] rounded-xl sm:rounded-2xl flex items-center justify-center text-[#B37943]">
                        <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#4A3525] tracking-wider truncate">{selectedOrder.customer_phone}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 sm:p-7 rounded-xl sm:rounded-[2rem] border border-[#E5C492] space-y-3 sm:space-y-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-[#4A3525] uppercase tracking-[0.25em] flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#B37943]" /> Delivery Coordinates
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-xs sm:text-sm font-bold text-[#4A3525] leading-relaxed">{selectedOrder.address}</p>
                    <p className="text-[10px] sm:text-xs text-[#B37943] font-medium tracking-wide">{selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</p>
                    {selectedOrder.landmark && (
                      <p className="text-[9px] sm:text-[10px] text-[#B37943] font-bold uppercase mt-1 sm:mt-2">Landmark: {selectedOrder.landmark}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-xl sm:rounded-[2rem] border border-[#E5C492] overflow-hidden shadow-sm">
                <div className="px-3 sm:px-8 py-2.5 sm:py-5 bg-[#FAF9F6]/50 border-b border-[#E5C492]">
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-[#4A3525] uppercase tracking-[0.25em] flex items-center gap-2">
                     <Package className="w-3.5 h-3.5 text-[#B37943]" /> Inventory Allocation
                  </h3>
                </div>
                <div className="divide-y divide-[#FAF9F6]">
                  {(selectedOrder.order_items || []).map((item: any) => (
                    <div key={item.id} className="p-3 sm:p-6 flex items-center justify-between hover:bg-[#FAF9F6]/20 transition-colors">
                      <div className="flex items-center gap-3 sm:gap-5">
                        <div className="w-10 h-10 sm:w-16 sm:h-16 bg-[#FAF9F6] rounded-xl sm:rounded-2xl flex items-center justify-center text-[#B37943] border border-[#E5C492] shrink-0">
                          <Package className="w-5 h-5 sm:w-7 sm:h-7 opacity-20" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-[#4A3525] truncate">{item.product_name}</p>
                          <p className="text-[9px] sm:text-[11px] text-[#B37943] font-bold uppercase tracking-[0.15em] mt-0.5 sm:mt-1 truncate">{item.variant_label} • {item.quantity} Units</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-lg font-bold text-[#4A3525] ml-2">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 sm:p-8 bg-[#FAF9F6]/40 flex items-center justify-between border-t border-[#E5C492]">
                  <span className="text-[10px] sm:text-[12px] font-bold text-[#B37943] uppercase tracking-[0.3em]">Total Value Protocol</span>
                  <div className="text-right">
                     <p className="text-xl sm:text-3xl font-bold text-[#4A3525]">₹{selectedOrder.total}</p>
                     <p className="text-[8px] sm:text-[10px] text-[#B37943] font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Payment Method: {selectedOrder.payment_method}</p>
                  </div>
                </div>
              </div>

              {/* Action & Shipment Section */}
              <div className="space-y-3 sm:space-y-4">
                {/* Tracking Info display if exists */}
                {selectedOrder.shipments && selectedOrder.shipments.length > 0 ? (
                  <div className="bg-white p-4 sm:p-7 rounded-xl sm:rounded-[2rem] border border-[#E5C492] flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-sm">
                    <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
                       <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
                          <Truck className="w-5 h-5 sm:w-7 sm:h-7" />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[9px] sm:text-[10px] font-bold text-[#B37943] uppercase tracking-[0.2em] mb-0.5 sm:mb-1">Waybill ID</p>
                          <p className="text-sm sm:text-xl font-bold text-[#4A3525] tracking-wider truncate">{selectedOrder.shipments[0].waybill}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => triggerLabelDownload([selectedOrder.shipments[0].waybill])}
                        className="flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 sm:py-4 bg-[#B37943] text-white font-bold rounded-lg sm:rounded-2xl hover:bg-[#96612F] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[9px] sm:text-[10px] shadow-sm flex items-center cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> Print
                      </button>
                      {selectedOrder.shipments[0].tracking_url && (
                        <a 
                          href={selectedOrder.shipments[0].tracking_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 sm:py-4 bg-white text-[#4A3525] font-bold rounded-lg sm:rounded-2xl border border-[#E5C492] hover:bg-[#FAF9F6] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[9px] sm:text-[10px] shadow-sm"
                        >
                          <ExternalLink className="w-4 h-4" /> Track
                        </a>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


