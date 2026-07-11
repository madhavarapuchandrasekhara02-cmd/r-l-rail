import { jsPDF } from 'jspdf'

export function generateAlternativeCourierPDF(orders: any[]) {
  const doc = new jsPDF('p', 'mm', 'a4')
  
  const colWidth = 85
  const rowHeight = 85
  const marginX = 14
  const marginY = 10
  const gapX = 12
  const gapY = 6

  orders.forEach((order, idx) => {
    const quadrantIndex = idx % 6

    if (idx > 0 && quadrantIndex === 0) {
      doc.addPage()
    }

    // 3x2 Quadrant layout:
    // q=0,1: row 0 (top)
    // q=2,3: row 1 (middle)
    // q=4,5: row 2 (bottom)
    const row = Math.floor(quadrantIndex / 2) // 0, 1, or 2
    const col = quadrantIndex % 2 // 0 or 1

    const colX = marginX + col * (colWidth + gapX)
    const rowY = marginY + row * (rowHeight + gapY)

    // Set bold font for field titles
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text("Order ID:", colX, rowY)
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)
    doc.text(` ${order.order_number}`, colX + 16, rowY)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text("Customer:", colX, rowY + 5.5)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)
    doc.text(` ${order.customer_name}`, colX + 18, rowY + 5.5)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text("Mobile:", colX, rowY + 11)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)
    doc.text(` ${order.customer_phone}`, colX + 13, rowY + 11)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text("Address:", colX, rowY + 16.5)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)
    
    const fullAddress = `${order.address || ''}, ${order.city || ''}, ${order.state || ''} - ${order.pincode || ''}${order.landmark ? `, Landmark: ${order.landmark}` : ''}`
    const wrappedAddress = doc.splitTextToSize(fullAddress, colWidth - 2)
    doc.text(wrappedAddress, colX, rowY + 21.5)

    const addressHeight = wrappedAddress.length * 4.5
    const itemsY = rowY + 21.5 + addressHeight + 2

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text("Items :", colX, itemsY)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)

    let itemOffset = 5
    order.order_items?.forEach((item: any) => {
      const itemText = `• ${item.product_name} (${item.variant_label || 'Standard'}) x ${item.quantity}`
      const wrappedItem = doc.splitTextToSize(itemText, colWidth - 5)
      doc.text(wrappedItem, colX + 3, itemsY + itemOffset)
      itemOffset += (wrappedItem.length * 4.5)
    })

    // Draw horizontal separator line below row 0 and row 1 (do not draw below row 2)
    if (row < 2) {
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.4)
      doc.line(colX, rowY + rowHeight + 3, colX + colWidth, rowY + rowHeight + 3)
    }
  })

  return doc
}
