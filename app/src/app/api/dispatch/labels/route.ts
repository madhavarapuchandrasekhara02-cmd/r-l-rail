import { NextRequest, NextResponse } from 'next/server'


const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN || ''
const DELHIVERY_BASE = process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com'

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
      // Fallback: If Delhivery fails (e.g. 401 in Staging), redirect to our custom labels page
      const fallbackUrl = new URL(`/admin/label/batch?waybills=${waybills}`, req.url)
      return NextResponse.redirect(fallbackUrl)
    }

    // Get the PDF buffer
    const arrayBuffer = await response.arrayBuffer()
    
    // Return the PDF to the browser
    return new NextResponse(arrayBuffer, {
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
