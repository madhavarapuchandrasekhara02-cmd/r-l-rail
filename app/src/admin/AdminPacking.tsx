import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Package, Printer, CheckCircle2, Circle, ListChecks, Download, ArrowRight, ClipboardList } from 'lucide-react'

type PackingItem = {
  productName: string
  variantLabel: string
  totalQuantity: number
  packed?: boolean
}

export default function AdminPacking() {
  const [items, setItems] = useState<PackingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [packedItems, setPackedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchPackingList()
  }, [])

  async function fetchPackingList() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('product_name, variant_label, quantity')
        .eq('status', 'Pending')

      if (error) throw error

      const aggregated = (data || []).reduce((acc: Record<string, PackingItem>, item: any) => {
        const key = `${item.product_name}-${item.variant_label}`
        if (!acc[key]) {
          acc[key] = {
            productName: item.product_name,
            variantLabel: item.variant_label,
            totalQuantity: 0,
          }
        }
        acc[key].totalQuantity += item.quantity
        return acc
      }, {})

      setItems(Object.values(aggregated))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const togglePacked = (key: string) => {
    setPackedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePrint = () => {
    window.print()
  }

  const totalToPack = items.reduce((sum, i) => sum + i.totalQuantity, 0)
  const packedCount = items.reduce((sum, i) => {
    const key = `${i.productName}-${i.variantLabel}`
    return packedItems[key] ? sum + i.totalQuantity : sum
  }, 0)
  
  const progressPercent = totalToPack > 0 ? (packedCount / totalToPack) * 100 : 0

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[#B37943] mb-2">
            <div className="w-10 h-10 bg-[#FAF9F6] rounded-xl flex items-center justify-center border border-[#E5C492]">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Inventory Protocol</span>
          </div>
          <h1 className="text-4xl font-serif text-[#4A3525]">Master Packing Station</h1>
          <p className="text-sm text-[#B37943] italic font-serif">Aggregated inventory requirements for all pending fulfillments.</p>
        </div>
        
        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3.5 bg-white text-[#4A3525] border border-[#E5C492] rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#FAF9F6] transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> Export Manifest
          </button>
        </div>
      </header>

      {/* Progress & Stats Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl sm:rounded-[2rem] border border-[#E5C492] p-4 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-[0.2em]">Fulfillment Progress</span>
            <span className="text-sm font-serif text-[#4A3525]">{Math.round(progressPercent)}% Manifested</span>
          </div>
          <div className="h-2.5 w-full bg-[#FAF9F6] rounded-full overflow-hidden border border-[#E5C492]/50">
            <div 
              className="h-full bg-[#4A3525] transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(58,54,49,0.2)]" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-medium text-[#B37943] uppercase tracking-widest pt-1">
            <span>0 Units</span>
            <span>{totalToPack} Units Total</span>
          </div>
        </div>

        <div className="bg-[#4A3525] rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 text-white flex flex-col justify-between shadow-xl shadow-[#4A3525]/10">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-6 h-6 opacity-50" />
            <div className="px-2 py-1 bg-white/10 rounded-lg text-[8px] font-bold uppercase tracking-widest">Live Load</div>
          </div>
          <div>
            <p className="text-4xl font-serif mb-1">{totalToPack}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Total Units to Dispatch</p>
          </div>
        </div>
      </div>

      {/* Packing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-24 text-center">
            <div className="w-10 h-10 border-2 border-[#B37943] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#B37943] font-serif italic">Synchronizing inventory records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-24 bg-white rounded-[2.5rem] border border-dashed border-[#E5C492] text-center space-y-4">
            <div className="w-16 h-16 bg-[#FAF9F6] rounded-3xl flex items-center justify-center mx-auto text-[#B37943]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xl font-serif text-[#4A3525]">Warehouse Clear</p>
              <p className="text-sm text-[#B37943]">All manifests have been successfully fulfilled.</p>
            </div>
          </div>
        ) : (
          items.map((item) => {
            const key = `${item.productName}-${item.variantLabel}`
            const isPacked = packedItems[key]
            
            return (
              <div 
                key={key}
                onClick={() => togglePacked(key)}
                className={`group cursor-pointer relative bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
                  isPacked 
                  ? 'border-[#4A3525] bg-[#FAF9F6]/50 shadow-inner scale-[0.98]' 
                  : 'border-[#E5C492] hover:border-[#4A3525] hover:shadow-xl hover:shadow-[#4A3525]/5'
                }`}
              >
                <div className="relative z-10 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-2xl transition-colors duration-500 ${isPacked ? 'bg-[#4A3525] text-white' : 'bg-[#FAF9F6] text-[#B37943]'}`}>
                      {isPacked ? <CheckCircle2 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                    </div>
                    <div className="text-right">
                      <p className={`text-4xl font-serif transition-colors duration-500 ${isPacked ? 'text-[#4A3525]' : 'text-[#4A3525]'}`}>{item.totalQuantity}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#B37943]">Units</p>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-lg font-serif transition-colors duration-500 mb-1 ${isPacked ? 'text-[#4A3525] line-through opacity-40' : 'text-[#4A3525]'}`}>
                      {item.productName}
                    </h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isPacked ? 'text-[#B37943] opacity-40' : 'text-[#B37943]'}`}>
                      {item.variantLabel}
                    </p>
                  </div>

                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${isPacked ? 'text-green-600 opacity-100' : 'text-[#4A3525]/0 opacity-0 translate-x-4'}`}>
                    Confirmed <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Decorative background number */}
                <div className={`absolute -right-4 -bottom-4 text-8xl font-serif transition-all duration-700 select-none pointer-events-none ${isPacked ? 'text-[#4A3525]/5 scale-110' : 'text-[#FAF9F6] group-hover:text-[#FAF9F6]/80'}`}>
                  {item.totalQuantity}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Printing Footer Note */}
      <div className="text-center py-8 opacity-40 italic font-serif text-[#B37943] print:hidden">
        End of Master Manifest &middot; Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  )
}
