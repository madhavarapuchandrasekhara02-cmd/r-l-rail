"use client";
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle, Package } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfToday, parseISO } from 'date-fns'

export default function AdminDailyTracker() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())

  useEffect(() => {
    async function fetchAllOrders() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, order_number, created_at, status, customer_name, total')
          .neq('status', 'Pending')
          .order('created_at', { ascending: true })

        if (error) throw error
        setOrders(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAllOrders()
  }, [])

  // Identify orders that are paid and waiting for packing
  const isPendingOrder = (status: string) => {
    const s = status?.toLowerCase() || ''
    return s === 'paid'
  }

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    })
  }, [currentMonth])

  // Get orders for the selected date
  const selectedDateOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = parseISO(o.created_at)
      return isSameDay(orderDate, selectedDate) && isPendingOrder(o.status)
    })
  }, [orders, selectedDate])

  const orderRangeString = useMemo(() => {
    if (selectedDateOrders.length === 0) return 'No pending orders'
    if (selectedDateOrders.length <= 3) return selectedDateOrders.map(o => o.order_number).join(', ')
    return `${selectedDateOrders.length} orders pending`
  }, [selectedDateOrders])

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto selection:bg-[#B37943]/20 selection:text-[#B37943]">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-serif text-[#4A3525] font-semibold">Daily Backlog Tracker</h1>
          <p className="text-[#B37943] font-medium tracking-wide uppercase text-[10px] mt-1">
            Ensure no orders slip through the cracks
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Side */}
        <div className="lg:col-span-5 bg-white p-3 sm:p-6 rounded-[2rem] border border-[#E5C492] shadow-sm lg:sticky lg:top-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-[#4A3525] uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#B37943]" /> {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-1.5 hover:bg-[#FAF9F6] rounded-xl text-[#B37943] border border-transparent hover:border-[#E5C492] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-[#FAF9F6] rounded-xl text-[#B37943] border border-transparent hover:border-[#E5C492] transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid gap-1 sm:gap-2 text-center mb-2" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-[9px] sm:text-[10px] font-bold text-[#B37943] uppercase">{d}</div>
            ))}
          </div>

          <div className="grid gap-1 sm:gap-2" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {/* Pad empty days for start of month */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 sm:h-12 lg:h-14 rounded-lg sm:rounded-xl" />
            ))}

            {daysInMonth.map(day => {
              // Calculate pending orders for this specific day
              const pendingCount = orders.filter(o => isSameDay(parseISO(o.created_at), day) && isPendingOrder(o.status)).length
              const totalCount = orders.filter(o => isSameDay(parseISO(o.created_at), day)).length
              
              const isToday = isSameDay(day, startOfToday())
              const isSelected = isSameDay(day, selectedDate)
              const isPast = isBefore(day, startOfToday())
              
              let badgeState = 'none' // none, success, alert, normal
              if (totalCount > 0) {
                if (pendingCount === 0) badgeState = 'success'
                else if (isPast && pendingCount > 0) badgeState = 'alert'
                else badgeState = 'normal'
              }

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    h-11 sm:h-14 lg:h-16 rounded-lg sm:rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all border
                    ${isSelected ? 'border-[#4A3525] bg-[#4A3525] text-white shadow-md' : 'border-transparent hover:bg-[#FAF9F6] hover:border-[#E5C492]/50 text-[#4A3525]'}
                    ${isToday && !isSelected ? 'bg-[#FAF3E8] border-[#E5C492]' : ''}
                  `}
                >
                  <div className="h-4 flex items-center justify-center">
                    {badgeState === 'alert' && (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white shadow-sm border border-white animate-pulse">
                        {pendingCount}
                      </div>
                    )}
                    {badgeState === 'normal' && (
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'bg-white text-[#4A3525]' : 'bg-[#B37943] text-white'} rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold shadow-sm border border-white`}>
                        {pendingCount}
                      </div>
                    )}
                    {badgeState === 'success' && (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm border border-white">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold ${isSelected ? 'text-white' : ''}`}>{format(day, 'd')}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-8 space-y-3 bg-[#FAF9F6] p-4 rounded-xl border border-[#E5C492]">
            <div className="flex items-center gap-3 text-xs text-[#4A3525] font-medium">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm" /> 
              <span>Past orders unfulfilled (Needs Attention)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#4A3525] font-medium">
              <div className="w-3 h-3 bg-[#B37943] rounded-full shadow-sm" /> 
              <span>Today's pending orders</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#4A3525] font-medium">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm" /> 
              <span>All orders shipped for this day</span>
            </div>
          </div>
        </div>

        {/* List Side */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-4 md:p-8 rounded-[2rem] border border-[#E5C492] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-xl font-serif text-[#4A3525] mb-1">
                  {isSameDay(selectedDate, startOfToday()) ? "Today's Backlog" : `Backlog for ${format(selectedDate, 'MMM do, yyyy')}`}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="bg-[#FAF3E8] px-3 py-1 rounded-lg text-[#B37943] font-bold text-[10px] uppercase tracking-widest border border-[#E5C492]/50">
                    {selectedDateOrders.length} Orders Pending
                  </span>
                  {selectedDateOrders.length > 0 && (
                     <span className="bg-[#FAF9F6] px-3 py-1 rounded-lg text-[#4A3525] font-bold text-[10px] uppercase tracking-widest border border-[#E5C492]/50">
                       {orderRangeString}
                     </span>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20 text-[#B37943]"><AlertCircle className="w-8 h-8 animate-pulse" /></div>
            ) : selectedDateOrders.length === 0 ? (
              <div className="text-center py-16 bg-[#FAF9F6]/50 rounded-2xl border border-dashed border-[#E5C492]">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-50" />
                <p className="text-[#B37943] font-bold uppercase tracking-widest text-xs">All Caught Up</p>
                <p className="text-[#8B7355] text-sm mt-2">No pending orders for this date.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {selectedDateOrders.map(order => (
                  <div key={order.id} className="p-3 rounded-xl border border-[#E5C492]/50 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FAF3E8] text-[#B37943] flex items-center justify-center border border-[#E5C492]/50 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#4A3525] text-sm">{order.order_number}</p>
                      </div>
                    </div>
                    <p className="font-bold text-[#4A3525] text-sm shrink-0 ml-2">₹{order.total}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

