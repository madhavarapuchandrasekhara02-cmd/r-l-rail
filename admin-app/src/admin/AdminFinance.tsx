"use client";
import { useEffect, useState, useMemo } from 'react'
import { trpc } from '@/providers/trpc'
import { toast } from 'sonner'
import { 
  Calculator, 
  Calendar, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  Percent, 
  CheckCircle2, 
  AlertTriangle, 
  Settings, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react'

// Default constants for standard Indian tax compliance
const DEFAULT_BUSINESS_STATE = 'Andhra Pradesh'

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const FINANCIAL_YEARS = [
  { value: '2025-26', label: 'FY 2025 - 26' },
  { value: '2026-27', label: 'FY 2026 - 27' },
  { value: '2027-28', label: 'FY 2027 - 28' },
]

export default function AdminFinance() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return String(now.getMonth() + 1).padStart(2, '0')
  })
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date()
    return String(now.getFullYear())
  })
  const [businessState, setBusinessState] = useState(DEFAULT_BUSINESS_STATE)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const yearNum = parseInt(selectedYear)
  const startDate = new Date(yearNum, parseInt(selectedMonth) - 1, 1).toISOString()
  const endDate = new Date(yearNum, parseInt(selectedMonth), 0, 23, 59, 59, 999).toISOString()

  const { data: listData, refetch, isFetching } = trpc.order.list.useQuery({
    startDate,
    endDate,
    limit: 10000,
  })

  useEffect(() => {
    if (listData?.orders) {
      // Sort ascending as expected by AdminFinance
      const sorted = [...listData.orders].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setOrders(sorted)
    }
  }, [listData])

  useEffect(() => {
    setLoading(isFetching)
  }, [isFetching])

  async function fetchFinancialData() {
    await refetch()
  }

  // Live client-side GST & HSN calculations (No database space or duplicate tables)
  const processedOrders = useMemo(() => {
    return orders.map((order) => {
      const invoiceNumber = order.invoice_number || order.order_number

      let totalGross = 0
      let totalTaxable = 0
      let totalCGST = 0
      let totalSGST = 0
      let totalIGST = 0
      let totalGST = 0

      // Compute individual item rates & HSN codes directly from stored DB columns
      const items = (order.order_items || []).map((item: any) => {
        const itemGross = item.price * item.quantity
        
        const gstRate = item.gst_rate ?? 18
        const hsnCode = item.hsn_code ?? '33051090'

        // Use database stored values if they are non-zero, fallback to safe reverse calculations if historical/null/zero
        const taxable = (item.taxable_value && item.taxable_value > 0)
          ? item.taxable_value
          : (itemGross / (1 + gstRate / 100))

        let cgst = item.cgst_amount || 0
        let sgst = item.sgst_amount || 0
        let igst = item.igst_amount || 0

        // If all database stored tax amounts are zero, calculate them dynamically on the fly
        if (cgst === 0 && sgst === 0 && igst === 0) {
          const gstAmount = itemGross - taxable
          const isSameState = (order.state || '').trim().toLowerCase() === businessState.trim().toLowerCase()
          if (isSameState) {
            cgst = gstAmount / 2
            sgst = gstAmount / 2
          } else {
            igst = gstAmount
          }
        }

        const gstAmount = cgst + sgst + igst

        return {
          ...item,
          hsnCode,
          gstRate,
          taxable,
          cgst,
          sgst,
          igst,
          itemGross,
          gstAmount
        }
      })

      // Sum everything up to get exact totals matching database
      items.forEach((item: any) => {
        totalGross += item.itemGross
        totalTaxable += item.taxable
        totalCGST += item.cgst
        totalSGST += item.sgst
        totalIGST += item.igst
        totalGST += item.gstAmount
      })

      // Skip courier shipping charge entirely per client request (no GST calculated on shipping)

      return {
        ...order,
        invoiceNumber,
        items,
        totalGross,
        totalTaxable,
        totalCGST,
        totalSGST,
        totalIGST,
        totalGST
      }
    })
  }, [orders, businessState])

  // Dynamic tax rate category compiler (Union of default rates + any actual custom rates from transaction history)
  const dynamicRates = useMemo(() => {
    const rates = new Set<number>()
    processedOrders.forEach((o) => {
      if (o.status !== 'Cancelled') {
        o.items.forEach((item: any) => {
          if (typeof item.gstRate === 'number') {
            rates.add(item.gstRate)
          }
        })
      }
    })
    return Array.from(rates).sort((a, b) => a - b)
  }, [processedOrders])

  // Monthly Financial Summary Metrics
  const summary = useMemo(() => {
    let grossRevenue = 0
    let totalGST = 0
    let refundAmount = 0
    let paidOrdersCount = 0

    processedOrders.forEach((o) => {
      if (o.status === 'Cancelled') {
        refundAmount += o.totalGross
      } else {
        grossRevenue += o.totalGross
        totalGST += o.totalGST
        paidOrdersCount++
      }
    })

    const netRevenue = grossRevenue - refundAmount

    return {
      totalOrders: orders.length,
      paidOrders: paidOrdersCount,
      grossRevenue,
      gstCollected: totalGST,
      refundAmount,
      netRevenue,
    }
  }, [processedOrders, orders])

  // Live Paginated Orders for UI display
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return processedOrders.slice(startIndex, startIndex + itemsPerPage)
  }, [processedOrders, currentPage])

  const totalPages = Math.ceil(processedOrders.length / itemsPerPage)

  // 1. DYNAMIC EXCELJS EXPORT (Client-Side, Multi-Sheet, Styled)
  const handleExportExcel = async () => {
    if (processedOrders.length === 0) {
      toast.error('No transactions available in the selected period to export.')
      return
    }
    try {
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      
      workbook.creator = 'Roots & Leaves'
      workbook.lastModifiedBy = 'Finance Center'
      workbook.created = new Date()

      // --- SHEET 1: SUMMARY ---
      const summarySheet = workbook.addWorksheet('Summary')
      summarySheet.columns = [
        { header: 'Commercial Metric', key: 'metric', width: 35 },
        { header: 'Value (INR)', key: 'val', width: 22 }
      ]
      
      summarySheet.addRow({ metric: 'Statement Month', val: `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}` })
      summarySheet.addRow({ metric: 'Total Orders Placed', val: summary.totalOrders })
      summarySheet.addRow({ metric: 'Active Revenue Orders', val: summary.paidOrders })
      summarySheet.addRow({ metric: 'Gross Commercial Revenue', val: summary.grossRevenue })
      summarySheet.addRow({ metric: 'Refunds / Cancelled Orders', val: summary.refundAmount })
      summarySheet.addRow({ metric: 'Total GST Liability Collected', val: summary.gstCollected })
      summarySheet.addRow({ metric: 'Net Settlement Revenue', val: summary.netRevenue })

      // Apply gorgeous luxury formatting
      summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
      summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4A3525' } }
      
      // Only format currency cells for actual monetary values (rows 5 to 8)
      for (let r = 5; r <= 8; r++) {
        summarySheet.getRow(r).getCell(2).numFmt = '₹#,##0.00'
      }

      // --- SHEET 2: GST SUMMARY ---
      const gstSheet = workbook.addWorksheet('GST Tax Summary')
      gstSheet.columns = [
        { header: 'Tax Category (%)', key: 'rate', width: 20 },
        { header: 'Taxable Base Value', key: 'base', width: 25 },
        { header: 'CGST Amount', key: 'cgst', width: 20 },
        { header: 'SGST Amount', key: 'sgst', width: 20 },
        { header: 'IGST Amount', key: 'igst', width: 20 },
        { header: 'Total GST Amount', key: 'totalGst', width: 22 }
      ]

      // Aggregate live calculations grouped by rate
      const taxRates = dynamicRates
      taxRates.forEach(rate => {
        let baseSum = 0
        let cgstSum = 0
        let sgstSum = 0
        let igstSum = 0
        let totalGstSum = 0

        processedOrders.forEach(o => {
          if (o.status !== 'Cancelled') {
            o.items.forEach((item: any) => {
              if (item.gstRate === rate) {
                baseSum += item.taxable
                cgstSum += item.cgst
                sgstSum += item.sgst
                igstSum += item.igst
                totalGstSum += item.gstAmount
              }
            })
          }
        })

        gstSheet.addRow({
          rate: `${rate}% GST`,
          base: baseSum,
          cgst: cgstSum,
          sgst: sgstSum,
          igst: igstSum,
          totalGst: totalGstSum
        })
      })

      gstSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
      gstSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4A3525' } }
      gstSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.getCell(2).numFmt = '₹#,##0.00'
          row.getCell(3).numFmt = '₹#,##0.00'
          row.getCell(4).numFmt = '₹#,##0.00'
          row.getCell(5).numFmt = '₹#,##0.00'
          row.getCell(6).numFmt = '₹#,##0.00'
        }
      })

      // --- SHEET 3: ORDER ITEMS DETAILS ---
      const detailSheet = workbook.addWorksheet('Transaction Register')
      detailSheet.columns = [
        { header: 'Invoice Number', key: 'invoice', width: 22 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Customer', key: 'customer', width: 25 },
        { header: 'State', key: 'state', width: 18 },
        { header: 'Product Item', key: 'prod', width: 35 },
        { header: 'Qty', key: 'qty', width: 8 },
        { header: 'GST Rate', key: 'rate', width: 12 },
        { header: 'Taxable Amount', key: 'taxable', width: 18 },
        { header: 'CGST', key: 'cgst', width: 15 },
        { header: 'SGST', key: 'sgst', width: 15 },
        { header: 'IGST', key: 'igst', width: 15 },
        { header: 'Gross Total', key: 'gross', width: 18 }
      ]

      processedOrders.forEach(o => {
        o.items.forEach((item: any) => {
          detailSheet.addRow({
            invoice: o.invoiceNumber,
            date: new Date(o.created_at).toLocaleDateString(),
            customer: o.customer_name,
            state: o.state,
            prod: item.product_name,
            qty: item.quantity,
            rate: `${item.gstRate}%`,
            taxable: item.taxable,
            cgst: item.cgst,
            sgst: item.sgst,
            igst: item.igst,
            gross: item.itemGross
          })
        })
      })

      detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
      detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4A3525' } }
      detailSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.getCell(8).numFmt = '₹#,##0.00'
          row.getCell(9).numFmt = '₹#,##0.00'
          row.getCell(10).numFmt = '₹#,##0.00'
          row.getCell(11).numFmt = '₹#,##0.00'
          row.getCell(12).numFmt = '₹#,##0.00'
        }
      })

      // --- SHEET 4: RECONCILIATION ---
      const reconSheet = workbook.addWorksheet('Payment Reconciliation')
      reconSheet.columns = [
        { header: 'Order Number', key: 'ord', width: 22 },
        { header: 'Invoice Number', key: 'invoice', width: 22 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Total Value', key: 'total', width: 18 },
        { header: 'Method', key: 'method', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Compliance Status', key: 'comp', width: 18 }
      ]

      processedOrders.forEach(o => {
        reconSheet.addRow({
          ord: o.order_number,
          invoice: o.invoiceNumber,
          date: new Date(o.created_at).toLocaleDateString(),
          total: o.totalGross,
          method: o.payment_method?.toUpperCase() || 'ONLINE',
          status: o.status,
          comp: o.status === 'Cancelled' ? 'Refund Processed' : 'Paid & Settled'
        })
      })

      reconSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
      reconSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4A3525' } }
      reconSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.getCell(4).numFmt = '₹#,##0.00'
        }
      })

      // Compile, trigger download, and clean memory instantly
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Roots_Leaves_CA_Report_${selectedMonth}_${selectedYear}.xlsx`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('Excel export failed:', err)
      alert('Failed to generate Excel report.')
    }
  }

  // 2. DYNAMIC PDF GENERATION (Client-Side, Luxury Theme, Printable)
  const handleExportPDF = async () => {
    if (processedOrders.length === 0) {
      toast.error('No transactions available in the selected period to export.')
      return
    }
    const toastId = toast.loading('Generating finance PDF report...')
    try {
      const { jsPDF } = await import('jspdf')
      // Custom type casting for jsPDF autoTable integration
      const doc = new jsPDF() as any

      // Brand Typography Setup
      doc.setFont('times', 'normal')
      
      // Header Section
      doc.setFillColor(74, 53, 37) // Deep Sandalwood brand color
      doc.rect(0, 0, 210, 38, 'F')
      
      doc.setTextColor(243, 233, 215) // Luxury Ivory text
      doc.setFontSize(22)
      doc.text('ROOTS & LEAVES', 15, 18)
      doc.setFontSize(8)
      doc.text('ANCIENT AYURVEDIC APOTHECARY', 15, 24)
      
      doc.setFontSize(14)
      doc.text('FINANCE & GST REPORT', 140, 18)
      doc.setFontSize(8)
      doc.text(`STATEMENT PERIOD: ${MONTHS.find(m => m.value === selectedMonth)?.label?.toUpperCase()} ${selectedYear}`, 140, 24)

      // Section 1: Executive Sales & Tax Summary
      doc.setTextColor(74, 53, 37)
      doc.setFontSize(14)
      doc.text('1. Executive Commercial Summary', 15, 52)
      doc.setDrawColor(197, 160, 89) // Soft Gold separator line
      doc.setLineWidth(0.4)
      doc.line(15, 54, 195, 54)

      // Render summary values in columns
      doc.setFontSize(10)
      doc.text(`Total Orders Placed:  ${summary.totalOrders}`, 15, 64)
      doc.text(`Active Taxed Orders:  ${summary.paidOrders}`, 15, 71)
      doc.text(`Gross Sales Revenue:  INR ${summary.grossRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 15, 78)
      
      doc.text(`Refunded/Cancelled:   INR ${summary.refundAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 115, 64)
      doc.text(`GST Taxes Collected:  INR ${summary.gstCollected.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 115, 71)
      doc.text(`Net Settleable Sales: INR ${summary.netRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 115, 78)

      // Section 2: GST breakdown by category
      doc.text('2. GST Liability Breakdown (Live Aggregated)', 15, 96)
      doc.line(15, 98, 195, 98)

      // Gather live tax brackets
      const brackets = dynamicRates
      const rows = brackets.map(rate => {
        let taxableSum = 0
        let cgstSum = 0
        let sgstSum = 0
        let igstSum = 0
        let totalGst = 0

        processedOrders.forEach(o => {
          if (o.status !== 'Cancelled') {
            o.items.forEach((item: any) => {
              if (item.gstRate === rate) {
                taxableSum += item.taxable
                cgstSum += item.cgst
                sgstSum += item.sgst
                igstSum += item.igst
                totalGst += item.gstAmount
              }
            })
          }
        })

        return [
          `${rate}% GST`,
          `INR ${taxableSum.toLocaleString('en-IN', {maximumFractionDigits:2})}`,
          `INR ${cgstSum.toLocaleString('en-IN', {maximumFractionDigits:2})}`,
          `INR ${sgstSum.toLocaleString('en-IN', {maximumFractionDigits:2})}`,
          `INR ${igstSum.toLocaleString('en-IN', {maximumFractionDigits:2})}`,
          `INR ${totalGst.toLocaleString('en-IN', {maximumFractionDigits:2})}`
        ]
      })

      // Simple Table draw without loading extra heavy scripts
      let y = 108
      doc.setFillColor(245, 243, 237)
      doc.rect(15, y - 6, 180, 7, 'F')
      doc.setFontSize(8)
      doc.setFont('times', 'bold')
      doc.text('Tax Category', 18, y - 1)
      doc.text('Taxable Base', 52, y - 1)
      doc.text('CGST (50%)', 88, y - 1)
      doc.text('SGST (50%)', 120, y - 1)
      doc.text('IGST (Out)', 150, y - 1)
      doc.text('Total GST', 180, y - 1)

      doc.setFont('times', 'normal')
      rows.forEach(row => {
        y += 8
        doc.text(row[0], 18, y - 1)
        doc.text(row[1], 52, y - 1)
        doc.text(row[2], 88, y - 1)
        doc.text(row[3], 120, y - 1)
        doc.text(row[4], 150, y - 1)
        doc.text(row[5], 180, y - 1)
      })

      // Section 3: Reconciliation & Compliance
      y += 18
      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.text('3. Payment Reconciliation Statement', 15, y)
      doc.line(15, y + 2, 195, y + 2)

      y += 10
      doc.setFontSize(9)
      doc.setFont('times', 'normal')
      const onlineOrders = processedOrders.filter(o => o.status !== 'Cancelled')
      const cashOnDelivery = onlineOrders.filter(o => o.payment_method?.toLowerCase() === 'cod')
      const prepaid = onlineOrders.filter(o => o.payment_method?.toLowerCase() !== 'cod')

      doc.text(`Prepaid Orders Settled:      ${prepaid.length} Payments (Gross Value: INR ${prepaid.reduce((sum, o) => sum + o.totalGross, 0).toLocaleString()})`, 18, y)
      doc.text(`COD Deliveries Pending:     ${cashOnDelivery.length} Collections (Gross Value: INR ${cashOnDelivery.reduce((sum, o) => sum + o.totalGross, 0).toLocaleString()})`, 18, y + 6)
      doc.text(`Disputed / Cancelled Orders:  ${processedOrders.filter(o => o.status === 'Cancelled').length} Orders (Net Reversed Tax Liability: INR ${summary.refundAmount.toLocaleString()})`, 18, y + 12)

      // Signature Area
      y += 35
      doc.setFontSize(9)
      doc.text('Prepared Dynamically by Roots & Leaves Accounting Software', 15, y)
      doc.text('Authorized Signatory / Admin Approval', 140, y)
      doc.setDrawColor(120, 100, 80, 0.4)
      doc.line(140, y - 5, 190, y - 5)

      // Save PDF instantly
      doc.save(`Roots_Leaves_CA_Report_${selectedMonth}_${selectedYear}.pdf`)
      toast.success('PDF downloaded!', { id: toastId })
    } catch (err) {
      console.error('PDF export failed:', err)
      toast.error('Failed to generate PDF report.', { id: toastId })
    }
  }

  // 3. BONUS: DYNAMIC TALLYPRIME IMPORT CSV GENERATOR (0 database footprint)
  const handleExportTally = () => {
    if (processedOrders.length === 0) {
      toast.error('No transactions available in the selected period to export.')
      return
    }
    try {
      const headers = [
        'Voucher Date',
        'Voucher Number',
        'Voucher Type',
        'Party Ledger Name',
        'Sales Ledger Name',
        'Taxable Value',
        'CGST Ledger',
        'SGST Ledger',
        'IGST Ledger',
        'Gross Value',
        'Payment Status'
      ]

      const csvRows = [headers.join(',')]

      processedOrders.forEach(o => {
        if (o.status !== 'Cancelled') {
          const dateStr = new Date(o.created_at).toLocaleDateString('en-GB') // DD/MM/YYYY format for Tally
          const isSameState = (o.state || '').trim().toLowerCase() === businessState.trim().toLowerCase()
          
          const salesLedger = isSameState ? 'Intrastate Sales' : 'Interstate Sales'
          const customerName = `"${o.customer_name.replace(/"/g, '""')}"`

          csvRows.push([
            dateStr,
            o.invoiceNumber,
            'Sales',
            customerName,
            salesLedger,
            o.totalTaxable.toFixed(2),
            isSameState ? (o.totalGST / 2).toFixed(2) : '0.00',
            isSameState ? (o.totalGST / 2).toFixed(2) : '0.00',
            !isSameState ? o.totalGST.toFixed(2) : '0.00',
            o.totalGross.toFixed(2),
            o.status
          ].join(','))
        }
      })

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Roots_Leaves_Tally_Import_${selectedMonth}_${selectedYear}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('Tally export failed:', err)
      alert('Failed to generate Tally Prime CSV.')
    }
  }

  // 4. ONE-CLICK PRINT MODE
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 selection:bg-[#B37943]/20 selection:text-[#B37943]">
      
      {/* Printable Style blocks to override layout for professional clean paper prints */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .printable-report-area, .printable-report-area * {
            visibility: visible;
          }
          .printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
        <div>
          <div className="flex items-center gap-3 text-[#B37943] mb-2">
            <Calculator className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-sans">Corporate Taxation</span>
          </div>
          <h1 className="text-4xl font-serif text-[#4A3525]">Finance &amp; CA Center</h1>
          <p className="text-sm text-[#B37943] italic font-serif mt-2">
            Aggregated Indian GST tax filing outputs and chartered accountant transaction ledgers.
          </p>
        </div>
      </header>

      {/* Control panel and settings (Earthy-styled cards) */}
      <section className="bg-white rounded-2xl border border-[#E5C492] p-4 sm:p-6 shadow-md shadow-[#4A3525]/3 flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
          {/* Month Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#B37943] uppercase tracking-widest mb-1.5 font-sans">
              Statement Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs font-serif font-semibold text-[#4A3525] focus:outline-none focus:ring-1 focus:ring-[#B37943]"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Financial Year Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#B37943] uppercase tracking-widest mb-1.5 font-sans">
              Financial Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs font-serif font-semibold text-[#4A3525] focus:outline-none focus:ring-1 focus:ring-[#B37943]"
            >
              {FINANCIAL_YEARS.map((fy) => (
                <option key={fy.value} value={fy.value.split('-')[0]}>{fy.label}</option>
              ))}
            </select>
          </div>

          {/* Business State Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#B37943] uppercase tracking-widest mb-1.5 font-sans">
              Business Location (GST State)
            </label>
            <select
              value={businessState}
              onChange={(e) => setBusinessState(e.target.value)}
              className="w-full h-10 px-3 bg-[#FAF9F6] border border-[#E5C492] rounded-xl text-xs font-serif font-semibold text-[#4A3525] focus:outline-none focus:ring-1 focus:ring-[#B37943]"
              disabled
            >
              <option value="Andhra Pradesh">Andhra Pradesh (Local)</option>
            </select>
          </div>
        </div>

        {/* Action Panel */}
        <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center gap-2.5 w-full lg:w-auto mt-4 lg:mt-0">
          <button
            onClick={handleExportExcel}
            className="h-10 px-4 bg-[#4A3525] hover:bg-[#3D2B1E] text-white rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer shadow-sm flex-1 sm:flex-initial justify-center"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#EADCC8]" /> Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="h-10 px-4 bg-white hover:bg-[#FAF3E8] border border-[#E5C492] text-[#4A3525] rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer shadow-sm flex-1 sm:flex-initial justify-center"
          >
            <FileText className="w-3.5 h-3.5 text-[#B37943]" /> Export PDF
          </button>
          <button
            onClick={handleExportTally}
            className="h-10 px-4 bg-[#B37943] hover:bg-[#9E6735] text-white rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer shadow-sm flex-1 sm:flex-initial justify-center"
          >
            <Download className="w-3.5 h-3.5 text-[#FAF3E8]" /> Export Tally
          </button>
          <button
            onClick={handlePrint}
            className="h-10 px-4 bg-white hover:bg-[#FAF3E8] border border-[#E5C492] text-[#4A3525] rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer shadow-sm flex-1 sm:flex-initial justify-center"
          >
            <Printer className="w-3.5 h-3.5 text-[#B37943]" /> Print
          </button>
        </div>
      </section>

      {/* Main Preview Area */}
      <section className="printable-report-area space-y-8">
        
        {/* Printable Only Header */}
        <div className="hidden print:block border-b-2 border-[#4A3525] pb-6 mb-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-serif text-[#4A3525] tracking-wider uppercase font-semibold">ROOTS &amp; LEAVES</h1>
              <p className="text-[10px] text-[#7B6856] uppercase tracking-widest font-sans">Ancient Ayurvedic Apothecary &amp; Organic Nutrition</p>
              <p className="text-xs text-[#7B6856] mt-2">State Jurisdiction: {businessState}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-serif text-[#4A3525] font-semibold">FINANCE &amp; GST STATEMENT</h2>
              <p className="text-xs text-[#7B6856] font-sans font-medium uppercase mt-1">Period: {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
            </div>
          </div>
        </div>

        {/* 1. Monthly Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          
          {/* Card: Total Orders */}
          <div className="bg-white rounded-2xl border border-[#E5C492] p-3 sm:p-5 shadow-sm">
            <p className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest mb-1.5 font-sans">Total Orders</p>
            <div className="flex items-end gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#4A3525]">{summary.totalOrders}</span>
              <span className="text-[9px] text-[#7B6856] font-semibold mb-0.5 font-sans">Placed</span>
            </div>
          </div>

          {/* Card: Gross Revenue */}
          <div className="bg-white rounded-2xl border border-[#E5C492] p-3 sm:p-5 shadow-sm">
            <p className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest mb-1.5 font-sans">Gross Revenue</p>
            <div className="flex items-end gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#4A3525]">₹{summary.grossRevenue.toLocaleString('en-IN')}</span>
              <span className="text-[8px] sm:text-[9px] text-green-700 font-bold mb-0.5 font-sans bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Pre-Refund</span>
            </div>
          </div>

          {/* Card: GST Collected */}
          <div className="bg-white rounded-2xl border border-[#E5C492] p-3 sm:p-5 shadow-sm">
            <p className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest mb-1.5 font-sans">GST Collected</p>
            <div className="flex items-end gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#4A3525]">₹{Math.round(summary.gstCollected).toLocaleString('en-IN')}</span>
              <span className="text-[8px] sm:text-[9px] text-[#B37943] font-bold mb-0.5 font-sans bg-[#FAF3E8] px-1.5 py-0.5 rounded border border-[#E5C492]/30 flex items-center gap-1">
                <Percent className="w-2 h-2 shrink-0" /> Tax
              </span>
            </div>
          </div>

          {/* Card: Refund Amount */}
          <div className="bg-white rounded-2xl border border-[#E5C492] p-3 sm:p-5 shadow-sm">
            <p className="text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1.5 font-sans">Refund / Cancelled</p>
            <div className="flex items-end gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-serif font-bold text-rose-700">₹{summary.refundAmount.toLocaleString('en-IN')}</span>
              <span className="text-[8px] sm:text-[9px] text-rose-700 font-semibold mb-0.5 font-sans bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Reversed</span>
            </div>
          </div>

          {/* Card: Net Revenue */}
          <div className="bg-[#4A3525] rounded-2xl p-3 sm:p-5 text-white shadow-xl shadow-[#4A3525]/10 col-span-2 sm:col-span-1">
            <p className="text-[9px] font-bold text-[#EADCC8] uppercase tracking-widest mb-1.5 font-sans">Net Settlement</p>
            <div className="flex items-end gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#FAF9F6]">₹{summary.netRevenue.toLocaleString('en-IN')}</span>
              <span className="text-[8px] sm:text-[9px] text-[#EADCC8] font-bold mb-0.5 font-sans bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> Active
              </span>
            </div>
          </div>

        </div>

        {/* 2. live GST Tax Bracket details */}
        <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 shadow-sm overflow-hidden">
          <div className="mb-6">
            <h3 className="text-lg font-serif text-[#4A3525]">GST Category Liability Breakdown</h3>
            <p className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest font-sans">Tax Bracket Aggregation on Revenue Orders</p>
          </div>
          
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E5C492] text-[10px] font-bold text-[#B37943] uppercase tracking-widest font-sans bg-[#FAF9F6]">
                  <th className="py-3 px-4">GST Rate Bracket</th>
                  <th className="py-3 px-4 text-right">Taxable base value</th>
                  <th className="py-3 px-4 text-right">CGST (Intra-state 50%)</th>
                  <th className="py-3 px-4 text-right">SGST (Intra-state 50%)</th>
                  <th className="py-3 px-4 text-right">IGST (Inter-state 100%)</th>
                  <th className="py-3 px-4 text-right">Aggregate Tax Collected</th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#4A3525] font-serif divide-y divide-[#FAF3E8]">
                {dynamicRates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs font-semibold text-[#B37943] uppercase tracking-widest font-sans">
                      No active tax transactions for this period
                    </td>
                  </tr>
                ) : (
                  dynamicRates.map((rate) => {
                    let taxableSum = 0
                    let cgstSum = 0
                    let sgstSum = 0
                    let igstSum = 0
                    let totalGst = 0

                    processedOrders.forEach((o) => {
                      if (o.status !== 'Cancelled') {
                        o.items.forEach((item: any) => {
                          if (item.gstRate === rate) {
                            taxableSum += item.taxable
                            cgstSum += item.cgst
                            sgstSum += item.sgst
                            igstSum += item.igst
                            totalGst += item.gstAmount
                          }
                        })
                      }
                    })

                    return (
                      <tr key={rate} className="hover:bg-[#FAF9F6]/40 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#B37943]">{rate}% Standard Tax Bracket</td>
                        <td className="py-4 px-4 text-right">₹{taxableSum.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="py-4 px-4 text-right">₹{cgstSum.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="py-4 px-4 text-right">₹{sgstSum.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="py-4 px-4 text-right">₹{igstSum.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="py-4 px-4 text-right font-bold">₹{totalGst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Report Preview Table */}
        <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-serif text-[#4A3525]">Monthly Tax Invoice Register</h3>
              <p className="text-[9px] font-bold text-[#B37943] uppercase tracking-widest font-sans">Transaction details &amp; dynamic GST calculations</p>
            </div>
            <span className="no-print px-3 py-1 bg-[#FAF9F6] border border-[#E5C492] text-[10px] font-bold text-[#B37943] rounded-lg uppercase tracking-widest">
              Total {processedOrders.length} Invoices
            </span>
          </div>

          {/* Premium scrolling wrapper with constrained max-height and sticky header */}
          <div className="overflow-x-auto overflow-y-auto max-h-[460px] border border-[#E5C492]/20 rounded-xl scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[950px] relative">
              <thead className="sticky top-0 bg-[#FAF9F6] z-10 border-b border-[#E5C492]/20">
                <tr className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest font-sans">
                  <th className="py-3.5 px-4 bg-[#FAF9F6]">Invoice Number</th>
                  <th className="py-3.5 px-4 bg-[#FAF9F6]">Order ID</th>
                  <th className="py-3.5 px-4 bg-[#FAF9F6]">Customer</th>
                  <th className="py-3.5 px-4 bg-[#FAF9F6]">State</th>
                  <th className="py-3.5 px-4 text-right bg-[#FAF9F6]">Base Taxable</th>
                  <th className="py-3.5 px-4 text-right bg-[#FAF9F6]">CGST</th>
                  <th className="py-3.5 px-4 text-right bg-[#FAF9F6]">SGST</th>
                  <th className="py-3.5 px-4 text-right bg-[#FAF9F6]">IGST</th>
                  <th className="py-3.5 px-4 text-right bg-[#FAF9F6]">Order Gross</th>
                  <th className="py-3.5 px-4 text-center bg-[#FAF9F6]">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#4A3525] font-serif divide-y divide-[#FAF3E8]">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-[#B37943] italic">
                      Live fetching order transactions...
                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-[#B37943] italic">
                      No transactional receipts recorded in this statement month.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#FAF9F6]/40 transition-colors">
                      <td className="py-4 px-4 font-bold text-[#B37943]">{o.invoiceNumber}</td>
                      <td className="py-4 px-4 font-mono text-[10px]">{o.order_number}</td>
                      <td className="py-4 px-4">{o.customer_name}</td>
                      <td className="py-4 px-4 font-semibold text-[#7B6856]">{o.state}</td>
                      <td className="py-4 px-4 text-right">₹{o.totalTaxable.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right text-[#7B6856]">₹{o.totalCGST.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right text-[#7B6856]">₹{o.totalSGST.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right text-[#7B6856]">₹{o.totalIGST.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right font-bold">₹{o.totalGross.toFixed(2)}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-sans font-bold uppercase tracking-wider ${
                          o.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                          {o.status === 'Cancelled' ? 'Cancelled' : 'Settled'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Premium Pagination Control (no-print) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E5C492]/20 pt-4 mt-6 no-print">
              <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest font-sans">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-xl border border-[#E5C492] flex items-center justify-center text-[#4A3525] disabled:opacity-40 hover:bg-[#FAF3E8]/40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-xl border border-[#E5C492] flex items-center justify-center text-[#4A3525] disabled:opacity-40 hover:bg-[#FAF3E8]/40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  )
}

