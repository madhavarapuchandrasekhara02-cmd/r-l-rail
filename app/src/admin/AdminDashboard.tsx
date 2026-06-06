import Link from 'next/link';
import { useEffect, useState } from 'react'

import { TrendingUp, Clock, ShoppingCart, Package, ArrowRight, User, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const [kpis, setKpis] = useState({ totalSales: 0, pendingOrders: 0, totalOrders: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // KPIs
        const { data: salesData } = await supabase
          .from('orders')
          .select('total')
          .in('status', ['Paid', 'Shipped', 'Delivered'])

        const { data: pendingData } = await supabase
          .from('orders')
          .select('id')
          .eq('status', 'Pending')

        const { count: ordersCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })

        setKpis({
          totalSales: salesData?.reduce((s, o) => s + (o.total || 0), 0) || 0,
          pendingOrders: pendingData?.length || 0,
          totalOrders: ordersCount || 0,
        })

        // Recent orders
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentOrders(orders || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#4A3525] mb-1">Business Overview</h1>
          <p className="text-[#B37943] font-medium tracking-wide uppercase text-[10px]">
            Operational Health • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 bg-white p-1 rounded-xl border border-[#E5C492] shadow-sm">
          <div className="px-3 py-1.5 bg-[#FAF9F6] rounded-lg text-[10px] font-bold text-[#4A3525] uppercase tracking-wider border border-[#E5C492]">
            Real-time
          </div>
          <div className="pr-3 py-1.5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-[#B37943]">System Active</span>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-4 sm:p-6 shadow-xl shadow-[#4A3525]/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#B37943]/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-[#B37943]/10 rounded-xl flex items-center justify-center text-[#B37943]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest bg-[#FAF9F6] px-2.5 py-1 rounded-full border border-[#E5C492]">Revenue</span>
          </div>
          <p className="text-[10px] font-bold text-[#B37943] uppercase tracking-wider mb-1">Total Sales</p>
          <p className="text-2xl font-serif text-[#4A3525]">₹{kpis.totalSales.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-4 sm:p-6 shadow-xl shadow-[#4A3525]/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#B37943]/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-[#B37943]/10 rounded-xl flex items-center justify-center text-[#B37943]">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest bg-[#FAF9F6] px-2.5 py-1 rounded-full border border-[#E5C492]">Attention</span>
          </div>
          <p className="text-[10px] font-bold text-[#B37943] uppercase tracking-wider mb-1">Pending Orders</p>
          <p className="text-2xl font-serif text-[#4A3525]">{kpis.pendingOrders}</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-4 sm:p-6 shadow-xl shadow-[#4A3525]/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#4A3525]/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-[#4A3525]/10 rounded-xl flex items-center justify-center text-[#4A3525]">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-bold text-[#4A3525] uppercase tracking-widest bg-[#FAF9F6] px-2.5 py-1 rounded-full border border-[#E5C492]">Volume</span>
          </div>
          <p className="text-[10px] font-bold text-[#B37943] uppercase tracking-wider mb-1">Lifetime Orders</p>
          <p className="text-2xl font-serif text-[#4A3525]">{kpis.totalOrders}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Orders List */}
        <div className="lg:col-span-3 bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] shadow-xl shadow-[#4A3525]/5 overflow-hidden">
          <div className="p-6 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif text-[#4A3525] mb-0.5">Recent Activity</h2>
              <p className="text-[10px] text-[#B37943] font-bold tracking-wide uppercase">Latest Incoming Orders</p>
            </div>
            <Link href="/admin/orders" className="text-[#B37943] hover:text-[#4A3525] transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              All Orders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="px-3 pb-3">
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-[#B37943]">
                <div className="w-6 h-6 border-2 border-[#B37943] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium">Syncing...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-[#B37943]">
                <p className="font-serif text-lg mb-0.5">Quiet moments...</p>
                <p className="text-xs">No recent orders to display yet.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-[#FAF9F6]/30 rounded-xl border border-transparent hover:border-[#E5C492] transition-all duration-300 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 bg-[#FAF9F6] rounded-lg flex items-center justify-center text-[#4A3525] shadow-sm border border-[#E5C492]">
                        <User className="w-4 h-4 opacity-60" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-serif text-[#4A3525] group-hover:text-[#B37943] transition-colors truncate">{order.customer_name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#B37943] font-medium">
                          <span>{order.order_number}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex sm:block items-center justify-between">
                      <p className="text-base font-serif text-[#4A3525] sm:mb-0.5">₹{order.total}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        order.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' :
                        order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-[#FAF9F6] text-[#B37943] border-[#E5C492]'
                      }`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & System Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#4A3525] rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 text-white relative overflow-hidden shadow-2xl shadow-[#4A3525]/20">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Package className="w-24 h-24 rotate-12" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-serif mb-5">Operations</h3>
              <div className="space-y-2.5">
                <Link href="/admin/products" className="flex items-center justify-between p-3.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 opacity-60" />
                    <span className="text-xs font-medium">Inventory</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/admin/packing" className="flex items-center justify-between p-3.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <Boxes className="w-4 h-4 opacity-60" />
                    <span className="text-xs font-medium">Fulfillment</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/admin/analytics" className="flex items-center justify-between p-3.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 opacity-60" />
                    <span className="text-xs font-medium">Analytics</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 border border-[#E5C492] shadow-xl shadow-[#4A3525]/5">
            <h3 className="text-sm font-serif text-[#4A3525] mb-5">Fulfillment Success</h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest">Order Completion</span>
                  <span className="text-xs font-serif text-[#4A3525]">94%</span>
                </div>
                <div className="h-2 bg-[#FAF9F6] rounded-full overflow-hidden border border-[#E5C492]">
                  <div className="h-full bg-[#B37943] rounded-full" style={{ width: '94%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5C492]">
                  <p className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest mb-0.5">Avg. Time</p>
                  <p className="text-base font-serif text-[#4A3525]">1.2 Days</p>
                </div>
                <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5C492]">
                  <p className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest mb-0.5">Returns</p>
                  <p className="text-base font-serif text-[#4A3525]">0.8%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Dummy Icons for missing ones
function Boxes(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function BarChart3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}
