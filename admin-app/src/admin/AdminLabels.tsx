"use client";

import { useEffect, useState, useMemo } from 'react'
import { trpc } from '@/providers/trpc'
import { toast } from 'sonner'
import {
  FileText,
  Search,
  Loader,
  Printer,
  Calendar,
  RefreshCw,
  Download,
  AlertCircle
} from 'lucide-react'

export default function AdminLabels() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWaybills, setSelectedWaybills] = useState<string[]>([])
  
  // Fetch all shipments using the admin query bypassing RLS
  const { data: shipments, isLoading, refetch } = trpc.dispatch.getRecentShipments.useQuery()

  const filteredShipments = useMemo(() => {
    if (!shipments) return []
    const q = searchQuery.toLowerCase()
    return shipments.filter((s: any) => 
      !q ||
      s.waybill?.toLowerCase().includes(q) ||
      s.order_id?.toLowerCase().includes(q)
    )
  }, [shipments, searchQuery])

  const toggleWaybill = (waybill: string) => {
    setSelectedWaybills(prev => prev.includes(waybill) ? prev.filter(x => x !== waybill) : [...prev, waybill])
  }
  const toggleAll = () => {
    setSelectedWaybills(prev => prev.length === filteredShipments.length ? [] : filteredShipments.map((s: any) => s.waybill))
  }

  const handleDownloadBatch = () => {
    if (selectedWaybills.length === 0) return toast.error('Select labels to download')
    toast.success(`Downloading ${selectedWaybills.length} labels...`)
    window.open(`/api/dispatch/labels?waybills=${selectedWaybills.join(',')}`, '_blank')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-6xl mx-auto selection:bg-[#B37943]/20 selection:text-[#B37943]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#B37943] text-xs font-bold uppercase tracking-[0.22em] font-sans">
            <FileText className="w-3.5 h-3.5" /> Operations
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#4A3525] font-semibold">Label Center</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#B37943]" />
            <input
              type="text"
              placeholder="Search Waybill or Order ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-10 pl-9 pr-4 bg-white border border-[#E5C492] rounded-xl text-xs outline-none focus:border-[#4A3525] text-[#4A3525] shadow-sm w-64 transition-all"
            />
          </div>
          <button onClick={() => refetch()} className="h-10 px-4 bg-white border border-[#E5C492] hover:bg-[#FAF3E8] rounded-xl flex items-center justify-center text-[#B37943] active:scale-[0.98] transition-all shadow-sm cursor-pointer whitespace-nowrap text-xs font-bold font-sans uppercase tracking-widest gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </header>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white p-3 md:p-4 rounded-2xl border border-[#E5C492] shadow-sm sticky top-4 z-20">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={selectedWaybills.length > 0 && selectedWaybills.length === filteredShipments.length} onChange={toggleAll} className="rounded border-[#E5C492] text-[#4A3525] focus:ring-[#4A3525] cursor-pointer w-4 h-4" />
          <span className="text-xs font-bold text-[#4A3525] uppercase tracking-widest font-sans">{selectedWaybills.length} Selected</span>
        </div>
        <button
          onClick={handleDownloadBatch}
          disabled={selectedWaybills.length === 0}
          className="h-9 px-4 bg-[#B37943] text-white hover:bg-[#96612F] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.98]"
        >
          <Printer className="w-3.5 h-3.5" /> Print Selected Labels
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#B37943]">
          <Loader className="w-8 h-8 animate-spin mb-3" />
          <p className="text-xs uppercase tracking-widest font-bold font-sans">Loading labels archive...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5C492] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#FAF9F6] border-b border-[#E5C492]">
                <tr className="text-[10px] uppercase font-sans tracking-widest text-[#B37943]">
                  <th className="py-4 px-5 w-12 text-center"></th>
                  <th className="py-4 px-4 font-semibold">Generated On</th>
                  <th className="py-4 px-4 font-semibold">Waybill (AWB)</th>
                  <th className="py-4 px-4 font-semibold">Order ID</th>
                  <th className="py-4 px-4 font-semibold text-center">Status</th>
                  <th className="py-4 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs font-semibold text-[#B37943] font-sans uppercase tracking-widest">No labels found</td>
                  </tr>
                )}
                {filteredShipments.map((s: any) => (
                  <tr key={s.id} className="border-b border-[#FAF3E8] hover:bg-[#FAF9F6]/30 text-xs text-[#4A3525] transition-colors">
                    <td className="py-4 px-5 text-center">
                      <input type="checkbox" checked={selectedWaybills.includes(s.waybill)} onChange={() => toggleWaybill(s.waybill)} className="rounded border-[#E5C492] text-[#4A3525] focus:ring-[#4A3525] cursor-pointer" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold">{new Date(s.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-[#B37943]">{new Date(s.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold">{s.waybill}</td>
                    <td className="py-4 px-4 text-[#7B6856] text-[10px] truncate max-w-[150px]">{s.order_id}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-[9px] tracking-wider uppercase border border-blue-100">
                        {s.tracking_status || 'Generated'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <a 
                        href={`/api/dispatch/labels?waybills=${s.waybill}`} 
                        target="_blank"
                        className="inline-flex items-center gap-1 h-8 px-3 bg-white border border-[#E5C492] hover:bg-[#FAF3E8] rounded-lg text-[9px] font-sans font-bold uppercase tracking-widest text-[#4A3525] transition-all"
                      >
                        <Download className="w-3 h-3 text-[#B37943]" /> PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
