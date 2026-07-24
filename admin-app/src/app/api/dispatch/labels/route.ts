import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

import { env } from '../../../../lib/env'
import { verifyToken } from '../../../../../api/lib/auth'

const DELHIVERY_API_TOKEN = env.DELHIVERY_API_TOKEN
const DELHIVERY_BASE = env.DELHIVERY_BASE_URL

function extractToken(req: NextRequest): string {
  // 1. Try secure cookie first
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const parts = c.trim().split("=");
      return [parts[0], parts.slice(1).join("=")];
    })
  );
  if (cookies["admin-token"]) {
    return decodeURIComponent(cookies["admin-token"]);
  }

  // 2. Try Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // 3. Fallback to query parameter (deprecated)
  const { searchParams } = new URL(req.url)
  const queryToken = searchParams.get('token')
  if (queryToken) return queryToken

  return "";
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authorize user
    const token = extractToken(req);
    if (!token) {
      return new NextResponse('Unauthorized: Missing session token', { status: 401 })
    }

    let user: { email: string } | null = null
    try {
      const payload = verifyToken(token)
      user = { email: payload.email }
    } catch {
      return new NextResponse('Unauthorized: Session is invalid or expired', { status: 401 })
    }

    const adminEmails = (env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = (user.email || "").toLowerCase();
    if (adminEmails.length === 0 || !adminEmails.includes(userEmail)) {
      return new NextResponse('Forbidden: You do not have admin access', { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const waybills = searchParams.get('waybills')
    const download = searchParams.get('download')

    if (!waybills) {
      return new NextResponse('Missing waybills parameter', { status: 400 })
    }

    if (!DELHIVERY_API_TOKEN || DELHIVERY_API_TOKEN === 'your-delhivery-api-token') {
      return new NextResponse('Delhivery API token is not configured', { status: 500 })
    }

    const waybillList = waybills.split(',').map(w => w.trim()).filter(Boolean)
    
    // Call Delhivery API in parallel for each waybill to prevent one invalid AWB from breaking the batch
    const fetchPromises = waybillList.map(async (wbn) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      try {
        const delhiveryUrl = `${DELHIVERY_BASE}/api/p/packing_slip?wbns=${wbn}&pdf=true`
        const response = await fetch(delhiveryUrl, {
          headers: {
            'Authorization': `Token ${DELHIVERY_API_TOKEN}`,
          },
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          console.warn(`[Labels API] Delhivery rejected waybill ${wbn} with status:`, response.status)
          return null
        }
        
        const json = await response.json()
        return json.packages?.[0] || null
      } catch (err: any) {
        clearTimeout(timeoutId)
        console.error(`[Labels API] Failed to fetch waybill ${wbn}:`, err.message || err)
        return null
      }
    })

    const packageResults = await Promise.all(fetchPromises)
    const validPackages = packageResults.filter(Boolean)

    if (validPackages.length === 0) {
      console.error('[Labels API] No valid packages found in Delhivery response for any of the waybills.')
      return new NextResponse('Error: Delhivery returned no package information for the requested waybills. Verify that the tracking IDs exist and are active on your Delhivery account.', { status: 404 })
    }

    // Create a new PDF document to merge all labels into one
    const mergedPdf = await PDFDocument.create()
    const embeddedPages: any[] = []

    // Fetch S3 PDFs in parallel using Promise.all to bypass sequential loop lag
    const downloadPromises = validPackages.map(async (pkg: any) => {
      if (!pkg.pdf_download_link) return null;
      try {
        const s3Controller = new AbortController()
        const s3Timeout = setTimeout(() => s3Controller.abort(), 8000) // 8 seconds timeout per file

        const pdfRes = await fetch(pkg.pdf_download_link, { signal: s3Controller.signal })
        clearTimeout(s3Timeout)

        if (!pdfRes.ok) return null;
        const pdfBuffer = await pdfRes.arrayBuffer()
        return await PDFDocument.load(pdfBuffer)
      } catch (e: any) {
        console.error(`[Labels API] S3 download failed for ${pkg.wbn}:`, e.message || e)
        return null
      }
    })

    const pdfDocs = await Promise.all(downloadPromises)

    for (const pdfDoc of pdfDocs) {
      if (pdfDoc) {
        const pages = pdfDoc.getPages()
        for (const p of pages) {
          const embedded = await mergedPdf.embedPage(p)
          embeddedPages.push(embedded)
        }
      }
    }

    if (embeddedPages.length === 0) {
       console.error('[Labels API] No valid PDFs could be extracted from Delhivery.')
       return new NextResponse('Error: No valid PDF files could be downloaded or parsed from Delhivery S3 links. Please verify that your waybill documents have been successfully generated.', { status: 502 })
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

    const disposition = download === 'true' ? 'attachment' : 'inline'
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    const parts = formatter.formatToParts(now)
    const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]))
    const filename = `shipping-labels_${partMap.day}-${partMap.month}-${partMap.year}_${partMap.hour}.${partMap.minute}.pdf`

    return new NextResponse(Buffer.from(mergedPdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('[Labels API] Exception:', error)
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
  }
}
