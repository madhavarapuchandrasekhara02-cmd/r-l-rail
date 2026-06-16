import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

import { env } from '../../../../lib/env'

const DELHIVERY_API_TOKEN = env.DELHIVERY_API_TOKEN
const DELHIVERY_BASE = env.DELHIVERY_BASE_URL

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const waybills = searchParams.get('waybills')

    if (!waybills) {
      return new NextResponse('Missing waybills parameter', { status: 400 })
    }

    if (!DELHIVERY_API_TOKEN || DELHIVERY_API_TOKEN === 'your-delhivery-api-token') {
      return new NextResponse('Delhivery API token is not configured', { status: 500 })
    }

    // Call Delhivery API
    const delhiveryUrl = `${DELHIVERY_BASE}/api/p/packing_slip?wbns=${waybills}&pdf=true`
    console.log('[Labels API] Fetching from Delhivery:', delhiveryUrl)

    const response = await fetch(delhiveryUrl, {
      headers: {
        'Authorization': `Token ${DELHIVERY_API_TOKEN}`,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('[Labels API] Delhivery error:', response.status, text)
      // Return the error directly instead of falling back to custom generated labels
      return new NextResponse(`Delhivery API Error: ${text}`, { status: response.status })
    }

    // Delhivery API returns a JSON object with 'packages' array containing 'pdf_download_link' (base64 string)
    const json = await response.json()
    
    if (!json.packages || json.packages.length === 0) {
       console.error('[Labels API] No packages found in response:', json)
       return new NextResponse(`Delhivery returned no packages for waybills: ${waybills}`, { status: 404 })
    }

    // Create a new PDF document to merge all labels into one
    const mergedPdf = await PDFDocument.create()
    const embeddedPages = []

    for (const pkg of json.packages) {
      if (pkg.pdf_download_link) {
        try {
          // Fetch the PDF from the S3 URL provided by Delhivery
          const pdfRes = await fetch(pkg.pdf_download_link)
          if (!pdfRes.ok) {
            console.error(`[Labels API] Failed to fetch PDF for ${pkg.wbn} from S3. Status: ${pdfRes.status}`)
            continue
          }
          const pdfBuffer = await pdfRes.arrayBuffer()
          const pdfDoc = await PDFDocument.load(pdfBuffer)
          
          const pages = pdfDoc.getPages()
          for (const p of pages) {
            const embedded = await mergedPdf.embedPage(p)
            embeddedPages.push(embedded)
          }
        } catch (err) {
          console.error(`[Labels API] Failed to merge label for waybill ${pkg.wbn}:`, err)
        }
      }
    }

    if (embeddedPages.length === 0) {
       console.error('[Labels API] No valid PDFs could be extracted. Falling back to custom label generation.')
       const fallbackUrl = new URL(`/admin/label/batch?waybills=${waybills}`, req.url)
       return NextResponse.redirect(fallbackUrl)
    }

    // A4 dimensions in points (72 points per inch)
    const A4_WIDTH = 595.28
    const A4_HEIGHT = 841.89
    const MARGIN = 15 // 15 points margin from page edges
    const GAP = 15    // 15 points gap between labels
    
    // Calculate dimensions for each label in a 2x2 grid
    const LABEL_WIDTH = (A4_WIDTH - (MARGIN * 2) - GAP) / 2
    const LABEL_HEIGHT = (A4_HEIGHT - (MARGIN * 2) - GAP) / 2

    // Arrange 4 labels per page
    for (let i = 0; i < embeddedPages.length; i += 4) {
      const page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT])
      const chunk = embeddedPages.slice(i, i + 4)
      
      for (let j = 0; j < chunk.length; j++) {
        const embeddedPage = chunk[j]
        
        // j=0: top-left, j=1: top-right, j=2: bottom-left, j=3: bottom-right
        const row = Math.floor(j / 2) // 0 for top row, 1 for bottom row
        const col = j % 2 // 0 for left col, 1 for right col
        
        const x = MARGIN + col * (LABEL_WIDTH + GAP)
        // PDF y-axis starts from bottom, so row=0 is placed higher
        const y = A4_HEIGHT - MARGIN - LABEL_HEIGHT - row * (LABEL_HEIGHT + GAP)
        
        page.drawPage(embeddedPage, {
          x,
          y,
          width: LABEL_WIDTH,
          height: LABEL_HEIGHT,
        })
      }
    }

    const mergedPdfBytes = await mergedPdf.save()

    // Return the combined PDF to the browser
    return new NextResponse(Buffer.from(mergedPdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="labels-${waybills.split(',')[0]}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('[Labels API] Exception:', error)
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
  }
}
