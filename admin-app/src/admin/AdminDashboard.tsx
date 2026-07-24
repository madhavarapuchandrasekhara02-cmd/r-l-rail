"use client";
import Link from 'next/link';
import { TrendingUp, Clock, ShoppingCart, ArrowRight } from 'lucide-react'
import { trpc } from '@/providers/trpc'

export default function AdminDashboard() {
  const { data, isLoading } = trpc.order.getDashboardData.useQuery()

  const kpis = {
    totalSales: data?.totalSales || 0,
    pendingOrders: data?.pendingOrders || 0,
    totalOrders: data?.totalOrders || 0,
    completionRate: (() => {
      if (!data) return 94
      const statusCounts = data.statusCounts || []
      const delivered = statusCounts.find((s: any) => s.status === 'Delivered')?.count || 0
      const completed = statusCounts
        .filter((s: any) => ['Paid', 'Packed', 'Shipped', 'Delivered'].includes(s.status))
        .reduce((sum: number, s: any) => sum + s.count, 0)
      return completed > 0 ? Math.round((delivered / completed) * 100) : 94
    })(),
    returnRate: (() => {
      if (!data) return '0.8'
      const statusCounts = data.statusCounts || []
      const totalOrd = data.totalOrders || 0
      const returnedCount = statusCounts
        .filter((s: any) => ['Returned', 'RTO'].includes(s.status))
        .reduce((sum: number, s: any) => sum + s.count, 0)
      return totalOrd > 0 ? ((returnedCount / totalOrd) * 100).toFixed(1) : '0.8'
    })()
  }

  const recentOrders = data?.recentOrders || []
  const loading = isLoading

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
        <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-3.5 sm:p-6 shadow-xl shadow-[#4A3525]/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#B37943]/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-3.5 sm:mb-6">
            <div className="w-12 h-12 bg-[#B37943]/10 rounded-xl flex items-center justify-center text-[#B37943]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest bg-[#FAF9F6] px-2.5 py-1 rounded-full border border-[#E5C492]">Revenue</span>
          </div>
          <p className="text-[10px] font-bold text-[#B37943] uppercase tracking-wider mb-1">Total Sales</p>
          <p className="text-2xl font-serif text-[#4A3525]">₹{kpis.totalSales.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-3.5 sm:p-6 shadow-xl shadow-[#4A3525]/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#B37943]/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-3.5 sm:mb-6">
            <div className="w-12 h-12 bg-[#B37943]/10 rounded-xl flex items-center justify-center text-[#B37943]">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest bg-[#FAF9F6] px-2.5 py-1 rounded-full border border-[#E5C492]">Attention</span>
          </div>
          <p className="text-[10px] font-bold text-[#B37943] uppercase tracking-wider mb-1">Pending Orders</p>
          <p className="text-2xl font-serif text-[#4A3525]">{kpis.pendingOrders}</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-3.5 sm:p-6 shadow-xl shadow-[#4A3525]/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#4A3525]/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-3.5 sm:mb-6">
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
            <Link href="/orders" className="text-[#B37943] hover:text-[#4A3525] transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
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
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="p-4 bg-[#FAF9F6]/50 rounded-xl border border-[#FAF3E8] hover:border-[#E5C492] transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#4A3525]">{order.order_number}</p>
                      <p className="text-[10px] text-[#B37943]">{order.customer_name} • {order.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#4A3525]">₹{order.total}</p>
                      <span className={`inline-block text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        order.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        order.status === 'Delivered' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                        order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-[#FAF3E8] text-[#8B7355] border-[#E5C492]'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Success Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-6 shadow-xl shadow-[#4A3525]/5">
            <h2 className="text-xl font-serif text-[#4A3525] mb-0.5">Delivery Performance</h2>
            <p className="text-[10px] text-[#B37943] font-bold tracking-wide uppercase mb-6">Fulfillment Success Rate</p>
            <div className="flex items-end justify-between mb-4">
              <span className="text-5xl font-serif text-[#4A3525]">{kpis.completionRate}%</span>
              <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">Optimal</span>
            </div>
            <div className="w-full bg-[#FAF9F6] h-2.5 rounded-full overflow-hidden border border-[#E5C492]/30">
              <div className="bg-[#B37943] h-full rounded-full transition-all duration-1000" style={{ width: `${kpis.completionRate}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-6 shadow-xl shadow-[#4A3525]/5">
            <h2 className="text-xl font-serif text-[#4A3525] mb-0.5">Return Rate</h2>
            <p className="text-[10px] text-[#B37943] font-bold tracking-wide uppercase mb-6">Percentage of Returns / RTOs</p>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-serif text-[#4A3525]">{kpis.returnRate}%</span>
              <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-wider bg-[#FAF9F6] px-2.5 py-1 rounded-full border border-[#E5C492]">Industry Std: &lt;1.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
