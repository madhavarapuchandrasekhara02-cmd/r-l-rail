"use client";
import { useEffect, useState } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line 
} from 'recharts'
import { 
  Activity, Calendar, TrendingUp, Trophy 
} from 'lucide-react'
import { trpc } from '@/providers/trpc'

export default function AdminAnalytics() {
  const { data, isLoading } = trpc.order.getAnalyticsData.useQuery()
  const [chartData, setChartData] = useState<any[]>([])
  const [weekStats, setWeekStats] = useState({ orders: 0, customers: 0, sales: 0 })
  const [monthStats, setMonthStats] = useState({ orders: 0, customers: 0, sales: 0 })
  const [topProducts, setTopProducts] = useState<any[]>([])

  const loading = isLoading

  useEffect(() => {
    if (!data) return

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1)

    const thirtyDayOrders = data.orders || []
    const topProds = data.topProducts || []

    // Process Chart Data
    const dailyData: Record<string, any> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dailyData[dateStr] = { date: dateStr, orders: 0, sales: 0 }
    }

    thirtyDayOrders.forEach((o: any) => {
      const dateStr = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (dailyData[dateStr]) {
        dailyData[dateStr].orders += 1
        dailyData[dateStr].sales += o.total || 0
      }
    })
    setChartData(Object.values(dailyData))

    // Week Stats (Last 7 Days)
    const weekOrders = thirtyDayOrders.filter((o: any) => new Date(o.created_at) >= sevenDaysAgo)
    const weekCustomers = new Set(weekOrders.map((o: any) => o.customer_phone)).size
    const weekSales = weekOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
    setWeekStats({ orders: weekOrders.length, customers: weekCustomers, sales: weekSales })

    // Month Stats (Current Month)
    const monthOrders = thirtyDayOrders.filter((o: any) => new Date(o.created_at) >= startOfMonthDate)
    const monthCustomers = new Set(monthOrders.map((o: any) => o.customer_phone)).size
    const monthSales = monthOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
    setMonthStats({ orders: monthOrders.length, customers: monthCustomers, sales: monthSales })

    // Top Products
    setTopProducts(
      topProds.map((p: any) => ({
        product_name: p.product_name,
        total_quantity: Number(p.total_quantity),
        total_revenue: Number(p.total_revenue),
      }))
    )
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B37943]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-[#B37943] mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Growth Intelligence</span>
          </div>
          <h1 className="text-4xl font-serif text-[#4A3525]">Performance Hub</h1>
          <p className="text-sm text-[#B37943] italic font-serif mt-2">Historical velocity and commercial trajectory.</p>
        </div>
      </header>

      {/* Main Chart Section */}
      <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-4 sm:p-8 shadow-xl shadow-[#4A3525]/5 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-serif text-[#4A3525]">Order Velocity</h3>
            <p className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest">Past 30 Days Transmission</p>
          </div>
          <div className="px-3 py-1.5 bg-[#FAF9F6] rounded-lg text-[9px] font-bold text-[#B37943] uppercase tracking-widest border border-[#E5C492]">
            Cumulative Load
          </div>
        </div>
        
        <div className="h-[220px] md:h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B37943" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#B37943" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FAF3E8" vertical={false} />
              <XAxis dataKey="date" stroke="#8B7355" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#8B7355" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FAF9F6', 
                  borderColor: '#E5C492', 
                  borderRadius: '1rem',
                  boxShadow: '0 10px 15px -3px rgba(74, 53, 37, 0.05)'
                }}
                labelStyle={{ fontFamily: 'serif', color: '#4A3525', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#B37943" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Summary Cards */}
        <div className="space-y-6">
          {/* Week Summary */}
          <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-6 shadow-xl shadow-[#4A3525]/5">
            <div className="flex items-center gap-3 text-xs text-[#B37943] uppercase font-bold tracking-widest mb-4">
              <Calendar className="w-4 h-4" /> 7-Day Velocity
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-[#8B7355] uppercase font-bold tracking-wider">Gross Bookings</p>
                <p className="text-3xl font-serif text-[#4A3525]">₹{weekStats.sales.toLocaleString('en-IN')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#FAF3E8]">
                <div>
                  <p className="text-[9px] text-[#8B7355] uppercase font-bold tracking-wider">Orders</p>
                  <p className="text-lg font-bold text-[#4A3525]">{weekStats.orders}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#8B7355] uppercase font-bold tracking-wider">Customers</p>
                  <p className="text-lg font-bold text-[#4A3525]">{weekStats.customers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Month Summary */}
          <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-6 shadow-xl shadow-[#4A3525]/5">
            <div className="flex items-center gap-3 text-xs text-[#B37943] uppercase font-bold tracking-widest mb-4">
              <TrendingUp className="w-4 h-4" /> Month-To-Date
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-[#8B7355] uppercase font-bold tracking-wider">Gross Bookings</p>
                <p className="text-3xl font-serif text-[#4A3525]">₹{monthStats.sales.toLocaleString('en-IN')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#FAF3E8]">
                <div>
                  <p className="text-[9px] text-[#8B7355] uppercase font-bold tracking-wider">Orders</p>
                  <p className="text-lg font-bold text-[#4A3525]">{monthStats.orders}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#8B7355] uppercase font-bold tracking-wider">Customers</p>
                  <p className="text-lg font-bold text-[#4A3525]">{monthStats.customers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Product Rankings */}
        <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-6 shadow-xl shadow-[#4A3525]/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-serif text-[#4A3525] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#B37943]" /> Catalog Leadership
              </h3>
              <p className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest mt-0.5">Top Sellers by Volume</p>
            </div>
          </div>

          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-center text-sm text-[#8B7355] py-12">No data recorded.</p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[#FAF9F6]/50 rounded-xl border border-[#FAF3E8]">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-serif font-bold text-[#B37943] bg-[#FAF3E8] w-6 h-6 flex items-center justify-center rounded-lg border border-[#E5C492]/40">{idx + 1}</span>
                    <div>
                      <p className="text-xs font-bold text-[#4A3525]">{p.product_name}</p>
                      <p className="text-[9px] text-[#8B7355] uppercase tracking-wider mt-0.5">{p.total_quantity} Units Transacted</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#4A3525]">₹{p.total_revenue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
