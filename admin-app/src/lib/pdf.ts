import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'

/**
 * Downloads shipping labels in chunked batches, merges them client-side, 
 * and triggers a single PDF file download in the browser.
 * This completely bypasses Vercel's 10-second serverless timeout limit.
 */
export async function downloadBulkLabels(waybills: string[]) {
  if (!waybills || waybills.length === 0) {
    toast.error('No waybills selected for download')
    return
  }

  const toastId = toast.loading(`Preparing to download ${waybills.length} labels...`)
  
  try {
    const CHUNK_SIZE = 10
    const chunks: string[][] = []
    
    for (let i = 0; i < waybills.length; i += CHUNK_SIZE) {
      chunks.push(waybills.slice(i, i + CHUNK_SIZE))
    }

    const mergedPdf = await PDFDocument.create()
    let successfullyMergedCount = 0

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index]
      toast.loading(
        `Fetching batch ${index + 1} of ${chunks.length} (${successfullyMergedCount} labels merged)...`,
        { id: toastId }
      )

      const url = `/api/dispatch/labels?waybills=${chunk.join(',')}`
      const res = await fetch(url)

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown network error')
        throw new Error(`Failed on batch ${index + 1}: ${errText}`)
      }

      const pdfBytes = await res.arrayBuffer()
      const chunkPdf = await PDFDocument.load(pdfBytes)
      const pages = await mergedPdf.copyPages(chunkPdf, chunkPdf.getPageIndices())
      
      for (const page of pages) {
        mergedPdf.addPage(page)
      }
      
      successfullyMergedCount += chunk.length
    }

    toast.loading('Compiling single PDF in your browser...', { id: toastId })
    const mergedPdfBytes = await mergedPdf.save()

    // Trigger browser file download
    const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `shipping-labels-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)

    toast.success(`Successfully downloaded ${waybills.length} labels in a single PDF!`, { id: toastId })
  } catch (err: any) {
    console.error('[Bulk PDF Download] Error:', err)
    toast.error(`Download failed: ${err.message || 'Unknown error'}`, { id: toastId })
  }
}
