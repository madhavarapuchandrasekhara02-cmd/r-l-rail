import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line 
} from 'recharts'
import { 
  Activity, Calendar, TrendingUp, Trophy 
} from 'lucide-react'

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const [weekStats, setWeekStats] = useState({ orders: 0, customers: 0, sales: 0 })
  const [monthStats, setMonthStats] = useState({ orders: 0, customers: 0, sales: 0 })
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // 1. Fetch Orders for Chart (Last 30 Days)
      const { data: thirtyDayOrders } = await supabase
        .from('orders')
        .select('created_at, total, customer_phone')
        .gte('created_at', thirtyDaysAgo.toISOString())

      // Process Chart Data
      const dailyData: Record<string, any> = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        dailyData[dateStr] = { date: dateStr, orders: 0, sales: 0 }
      }

      thirtyDayOrders?.forEach(o => {
        const dateStr = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (dailyData[dateStr]) {
          dailyData[dateStr].orders += 1
          dailyData[dateStr].sales += o.total || 0
        }
      })
      setChartData(Object.values(dailyData))

      // 2. Week Stats (Last 7 Days)
      const weekOrders = thirtyDayOrders?.filter(o => new Date(o.created_at) >= sevenDaysAgo) || []
      const weekCustomers = new Set(weekOrders.map(o => o.customer_phone)).size
      const weekSales = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      setWeekStats({ orders: weekOrders.length, customers: weekCustomers, sales: weekSales })

      // 3. Month Stats (Current Month)
      const monthOrders = thirtyDayOrders?.filter(o => new Date(o.created_at) >= startOfMonth) || []
      const monthCustomers = new Set(monthOrders.map(o => o.customer_phone)).size
      const monthSales = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      setMonthStats({ orders: monthOrders.length, customers: monthCustomers, sales: monthSales })

      // 4. Top Products (Simplified for now)
      const { data: topProds } = await supabase
        .from('order_items')
        .select('product_name, quantity, price')
        .limit(5)
      
      setTopProducts(topProds || [])

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EFEA" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#B37943', fontSize: 9, fontWeight: 600}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#B37943', fontSize: 9, fontWeight: 600}} 
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #E5C492', 
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                  fontSize: '11px',
                  fontFamily: 'Manrope'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="orders" 
                stroke="#B37943" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorOrders)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grids */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Performance */}
        <div className="bg-[#4A3525] rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-8 text-white shadow-2xl shadow-[#4A3525]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Calendar className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-serif">Weekly Velocity</h3>
              <span className="px-2 py-0.5 bg-white/10 rounded-full text-[8px] font-bold uppercase tracking-[0.2em]">Rolling 7 Days</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Orders</p>
                <p className="text-2xl font-serif">{weekStats.orders}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Customers</p>
                <p className="text-2xl font-serif">{weekStats.customers}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Total Sales</p>
                <p className="text-2xl font-serif">₹{weekStats.sales.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-4 sm:p-8 shadow-xl shadow-[#4A3525]/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <TrendingUp className="w-32 h-32 text-[#B37943]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-serif text-[#4A3525]">Monthly Trajectory</h3>
              <span className="px-2 py-0.5 bg-[#FAF9F6] text-[#B37943] rounded-full text-[8px] font-bold uppercase tracking-[0.2em]">Current Month</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#B37943] mb-1">Orders</p>
                <p className="text-2xl font-serif text-[#4A3525]">{monthStats.orders}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#B37943] mb-1">Customers</p>
                <p className="text-2xl font-serif text-[#4A3525]">{monthStats.customers}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#B37943] mb-1">Total Sales</p>
                <p className="text-2xl font-serif text-[#4A3525]">₹{monthStats.sales.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Better Things Section */}
      <div className="grid lg:grid-cols-1 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] p-4 sm:p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[#FAF9F6] rounded-2xl flex items-center justify-center text-[#B37943]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-serif text-[#4A3525]">Top Sellers</h3>
              <p className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest">Catalog Alpha</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
            {topProducts.length === 0 ? (
              <p className="text-xs text-[#B37943] italic">Waiting for market data...</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between border-b border-[#FAF9F6] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[#B37943] w-4">0{i + 1}</span>
                    <p className="text-xs font-medium text-[#4A3525]">{p.product_name}</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#B37943]">{p.quantity} Units</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
