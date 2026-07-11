import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

import { env } from '../../../../lib/env'
import { supabaseAdmin } from '../../../../../api/lib/supabase-admin'

const DELHIVERY_API_TOKEN = env.DELHIVERY_API_TOKEN
const DELHIVERY_BASE = env.DELHIVERY_BASE_URL

function extractToken(req: NextRequest): string {
  // Fallback to query token for mobile window.open contexts
  const { searchParams } = new URL(req.url)
  const queryToken = searchParams.get('token')
  if (queryToken) return queryToken

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const parts = c.trim().split("=");
      return [parts[0], parts.slice(1).join("=")];
    })
  );
  return cookies["sb-access-token"]
    ? decodeURIComponent(cookies["sb-access-token"])
    : "";
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authorize user
    const token = extractToken(req);
    if (!token) {
      return new NextResponse('Unauthorized: Missing session token', { status: 401 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
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

    if (!waybills) {
      return new NextResponse('Missing waybills parameter', { status: 400 })
    }

    if (!DELHIVERY_API_TOKEN || DELHIVERY_API_TOKEN === 'your-delhivery-api-token') {
      return new NextResponse('Delhivery API token is not configured', { status: 500 })
    }

    // Call Delhivery API with a strict 15-second timeout limit
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    let response;
    try {
      const delhiveryUrl = `${DELHIVERY_BASE}/api/p/packing_slip?wbns=${waybills}&pdf=true`
      console.log('[Labels API] Fetching from Delhivery:', delhiveryUrl)

      response = await fetch(delhiveryUrl, {
        headers: {
          'Authorization': `Token ${DELHIVERY_API_TOKEN}`,
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('[Labels API] Delhivery fetch timed out or failed:', err.message || err)
      return new NextResponse('Error: Fetching labels from Delhivery API timed out or failed. Please try again.', { status: 504 })
    }

    if (!response.ok) {
      console.error('[Labels API] Delhivery error status:', response.status)
      const text = await response.text().catch(() => '')
      return new NextResponse(`Error: Delhivery API returned error status ${response.status}. Detail: ${text}`, { status: response.status })
    }

    const json = await response.json()
    if (!json.packages || json.packages.length === 0) {
       console.error('[Labels API] No packages found in Delhivery response.')
       return new NextResponse('Error: Delhivery returned no package information for the requested waybills. Verify that the tracking IDs exist and are active on your Delhivery account.', { status: 404 })
    }

    // Create a new PDF document to merge all labels into one
    const mergedPdf = await PDFDocument.create()
    const embeddedPages: any[] = []

    // Fetch S3 PDFs in parallel using Promise.all to bypass sequential loop lag
    const downloadPromises = json.packages.map(async (pkg: any) => {
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

    // Return the combined PDF to the browser
    const disposition = 'inline'

    return new NextResponse(Buffer.from(mergedPdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="labels-${waybills.split(',')[0]}.pdf"`,
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
