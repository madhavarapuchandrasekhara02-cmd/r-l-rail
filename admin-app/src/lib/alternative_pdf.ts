import { jsPDF } from 'jspdf'

export function generateAlternativeCourierPDF(orders: any[]) {
  const doc = new jsPDF('p', 'mm', 'a4')
  
  const colWidth = 85
  const rowHeight = 120
  const marginX = 15
  const marginY = 15
  const gapX = 10
  const gapY = 15

  orders.forEach((order, idx) => {
    const pageIndex = Math.floor(idx / 4)
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
    doc.setFontSize(10)
    doc.text("Order ID:", colX, rowY)
    
    doc.setFont("helvetica", "normal")
    doc.text(` ${order.order_number}`, colX + 17, rowY)

    doc.setFont("helvetica", "bold")
    doc.text("Customer:", colX, rowY + 6)
    doc.setFont("helvetica", "normal")
    doc.text(` ${order.customer_name}`, colX + 18, rowY + 6)

    doc.setFont("helvetica", "bold")
    doc.text("Mobile:", colX, rowY + 12)
    doc.setFont("helvetica", "normal")
    doc.text(` ${order.customer_phone}`, colX + 13, rowY + 12)

    doc.setFont("helvetica", "bold")
    doc.text("Address:", colX, rowY + 18)
    doc.setFont("helvetica", "normal")
    
    const fullAddress = `${order.address || ''}, ${order.city || ''}, ${order.state || ''} - ${order.pincode || ''}${order.landmark ? `, Landmark: ${order.landmark}` : ''}`
    const wrappedAddress = doc.splitTextToSize(fullAddress, colWidth - 5)
    doc.text(wrappedAddress, colX, rowY + 23)

    const addressHeight = wrappedAddress.length * 4.5
    const itemsY = rowY + 23 + addressHeight + 2

    doc.setFont("helvetica", "bold")
    doc.text("Items :", colX, itemsY)
    doc.setFont("helvetica", "normal")

    let itemOffset = 5
    order.order_items?.forEach((item: any) => {
      const itemText = `• ${item.product_name} (${item.variant_label || 'Standard'}) x ${item.quantity}`
      const wrappedItem = doc.splitTextToSize(itemText, colWidth - 8)
      doc.text(wrappedItem, colX + 3, itemsY + itemOffset)
      itemOffset += (wrappedItem.length * 4.5)
    })

    // Draw grey horizontal line separator under the block
    doc.setDrawColor(200, 200, 200)
    doc.line(colX, rowY + rowHeight - 2, colX + colWidth, rowY + rowHeight - 2)
  })

  return doc
}
