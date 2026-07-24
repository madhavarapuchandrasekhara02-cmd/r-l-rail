"use client";
import { useEffect, useState } from 'react'
import { Package, Printer, CheckCircle2, Circle, ListChecks, ArrowRight, ClipboardList } from 'lucide-react'
import { trpc } from '@/providers/trpc'

type PackingItem = {
  productName: string
  variantLabel: string
  totalQuantity: number
  packed?: boolean
}

export default function AdminPacking() {
  const { data, isLoading, refetch } = trpc.order.getPackingList.useQuery()
  const [items, setItems] = useState<PackingItem[]>([])
  const [packedItems, setPackedItems] = useState<Record<string, boolean>>({})

  const loading = isLoading

  useEffect(() => {
    if (data?.items) {
      setItems(data.items as PackingItem[])
    }
  }, [data])

  const togglePacked = (key: string) => {
    setPackedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePrint = () => {
    window.print()
  }

  const sortedItems = [...items].sort((a, b) => a.productName.localeCompare(b.productName))
  const packedCount = sortedItems.filter(item => packedItems[`${item.productName}-${item.variantLabel}`]).length

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto selection:bg-[#B37943]/20 selection:text-[#B37943]">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-serif text-[#4A3525] font-semibold">Packing Assembly</h1>
          <p className="text-[#B37943] font-medium tracking-wide uppercase text-[10px] mt-1">
            Aggregate quantities for all paid & unfulfilled orders
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={handlePrint}
            disabled={loading || sortedItems.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5C492] text-[#4A3525] hover:bg-[#FAF9F6] text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-[#B37943]" /> Print Sheet
          </button>
        </div>
      </header>

      {loading ? (
        <div className="bg-white rounded-[2rem] border border-[#E5C492] p-12 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-[#B37943] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#B37943] font-medium">Assembling packing list...</p>
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-[#E5C492] p-16 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-40" />
          <p className="font-serif text-lg text-[#4A3525] mb-1">Assembly Complete</p>
          <p className="text-xs text-[#8B7355]">No paid orders are waiting to be packed.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-[#E5C492] shadow-xl shadow-[#4A3525]/5 overflow-hidden">
            <div className="p-6 sm:p-8 bg-[#FAF9F6] border-b border-[#E5C492] flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <ListChecks className="w-5 h-5 text-[#B37943]" />
                <span className="text-xs font-bold text-[#4A3525] uppercase tracking-widest">Aggregate Checklist</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#B37943] bg-white border border-[#E5C492]/80 px-4 py-1.5 rounded-full shadow-sm">
                <span>{packedCount} / {sortedItems.length} PACKED</span>
              </div>
            </div>

            <div className="divide-y divide-[#FAF3E8]">
              {sortedItems.map((item) => {
                const key = `${item.productName}-${item.variantLabel}`
                const isPacked = !!packedItems[key]

                return (
                  <div 
                    key={key}
                    onClick={() => togglePacked(key)}
                    className={`flex items-center justify-between p-5 sm:p-6 hover:bg-[#FAF9F6]/30 transition-colors cursor-pointer select-none group ${isPacked ? 'bg-[#FAF9F6]/20' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      {isPacked ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#E5C492] group-hover:text-[#B37943] transition-colors shrink-0" />
                      )}
                      <div>
                        <p className={`text-sm font-bold transition-all ${isPacked ? 'text-[#8B7355]/70 line-through' : 'text-[#4A3525]'}`}>{item.productName}</p>
                        <p className="text-[10px] text-[#B37943] mt-0.5">{item.variantLabel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-serif font-bold ${isPacked ? 'text-[#8B7355]/50' : 'text-[#4A3525]'}`}>x{item.totalQuantity}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
