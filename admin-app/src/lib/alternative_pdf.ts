import { jsPDF } from 'jspdf'

export function generateAlternativeCourierPDF(orders: any[]) {
  const doc = new jsPDF('p', 'mm', 'a4')
  
  const colWidth = 85
  const rowHeight = 125
  const marginX = 14
  const marginY = 15
  const gapX = 12
  const gapY = 15

  orders.forEach((order, idx) => {
    const quadrantIndex = idx % 4

    if (idx > 0 && quadrantIndex === 0) {
      doc.addPage()
    }

    // Quadrant layout:
    // q=0: top-left, q=1: top-right, q=2: bottom-left, q=3: bottom-right
    const row = Math.floor(quadrantIndex / 2) // 0 or 1
    const col = quadrantIndex % 2 // 0 or 1

    const colX = marginX + col * (colWidth + gapX)
    const rowY = marginY + row * (rowHeight + gapY)

    // Set bold font for field titles
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10.5)
    doc.text("Order ID:", colX, rowY)
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(` ${order.order_number}`, colX + 17, rowY)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10.5)
    doc.text("Customer:", colX, rowY + 7)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(` ${order.customer_name}`, colX + 19, rowY + 7)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10.5)
    doc.text("Mobile:", colX, rowY + 14)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(` ${order.customer_phone}`, colX + 14, rowY + 14)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10.5)
    doc.text("Address:", colX, rowY + 21)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    
    const fullAddress = `${order.address || ''}, ${order.city || ''}, ${order.state || ''} - ${order.pincode || ''}${order.landmark ? `, Landmark: ${order.landmark}` : ''}`
    const wrappedAddress = doc.splitTextToSize(fullAddress, colWidth - 2)
    doc.text(wrappedAddress, colX, rowY + 27)

    const addressHeight = wrappedAddress.length * 5
    const itemsY = rowY + 27 + addressHeight + 3

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10.5)
    doc.text("Items :", colX, itemsY)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)

    let itemOffset = 6
    order.order_items?.forEach((item: any) => {
      const itemText = `• ${item.product_name} (${item.variant_label || 'Standard'}) x ${item.quantity}`
      const wrappedItem = doc.splitTextToSize(itemText, colWidth - 5)
      doc.text(wrappedItem, colX + 3, itemsY + itemOffset)
      itemOffset += (wrappedItem.length * 5)
    })

    // Draw grey horizontal line separator under the top row blocks (to separate row 1 from row 2)
    if (row === 0) {
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.4)
      doc.line(colX, rowY + rowHeight + 5, colX + colWidth, rowY + rowHeight + 5)
    }
  })

  return doc
}
