import { jsPDF } from 'jspdf'

const getShortItemText = (item: any) => {
  const rawSize = item.variant_label ? item.variant_label.trim().toLowerCase() : "";
  let sizeStr = "";
  if (rawSize && rawSize !== "standard" && rawSize !== "std" && rawSize !== "default") {
    const cleanedSize = item.variant_label
      .replace(/\s+/g, "") // Remove spaces
      .replace(/grams?/gi, "g")
      .replace(/gms?/gi, "g")
      .replace(/kilograms?/gi, "kg")
      .replace(/kgs?/gi, "kg")
      .replace(/milliliters?/gi, "ml")
      .replace(/mls?/gi, "ml");
    sizeStr = ` (${cleanedSize})`;
  }
  return `• ${item.product_name}${sizeStr} x${item.quantity}`;
};

export function generateAlternativeCourierPDF(orders: any[]) {
  const doc = new jsPDF('p', 'mm', 'a4') as any

  const cardWidth = 94
  const cardHeight = 89

  orders.forEach((order, idx) => {
    const pageItemIdx = idx % 6

    if (idx > 0 && pageItemIdx === 0) {
      doc.addPage()
    }

    const col = pageItemIdx % 2 // 0 for Left, 1 for Right
    const row = Math.floor(pageItemIdx / 2) // 0 for Top, 1 for Middle, 2 for Bottom

    // Precise Layout Offsets
    const colX = col === 0 ? 8 : 108
    const rowY = 8 + (row * 95)

    // 1. Draw Grid Outlines (Dashed cut lines)
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.setLineDash([2, 2], 0)
    doc.rect(colX, rowY, cardWidth, cardHeight)
    doc.setLineDash([]) // Reset to solid line

    // 2. Header Section (Order ID in Forest Green)
    doc.setTextColor(15, 81, 50) // Forest Green
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text(`Order ID: ${order.order_number}`, colX + 8, rowY + 9)

    // Reset color to Off-Black for body text
    doc.setTextColor(33, 37, 41)

    // 3. Customer Details
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("Customer: ", colX + 8, rowY + 16)
    doc.setFont("helvetica", "normal")
    doc.text(order.customer_name || '', colX + 28, rowY + 16)

    // 4. Mobile Details
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("Mobile: ", colX + 8, rowY + 21.5)
    doc.setFont("helvetica", "normal")
    doc.text(order.customer_phone || '', colX + 22, rowY + 21.5)

    // 5. Address Details
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("Address: ", colX + 8, rowY + 27)
    doc.setFont("helvetica", "normal")

    const fullAddress = `${order.address || ''}, ${order.city || ''}, ${order.state || ''} - ${order.pincode || ''}${order.landmark ? `, Landmark: ${order.landmark}` : ''}`
    const wrappedAddress = doc.splitTextToSize(fullAddress, cardWidth - 16)
    
    // Print wrapped address lines using 5mm height offset
    wrappedAddress.forEach((line: string, lineIdx: number) => {
      doc.text(line, colX + 8, rowY + 32 + (lineIdx * 5))
    })

    // 6. Dynamic Items Section
    const itemsHeaderY = rowY + 32 + (wrappedAddress.length * 5) + 3

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("Items :", colX + 8, itemsHeaderY)

    // Adaptive font size & row height based on item count to fit the 89mm card height
    const itemsCount = order.order_items?.length || 0
    let fontSize = 11
    let rowSpacing = 6.5

    if (itemsCount === 3) {
      fontSize = 9.5
      rowSpacing = 5.2
    } else if (itemsCount >= 4 && itemsCount <= 6) {
      fontSize = 8.5
      rowSpacing = 4.5
    } else if (itemsCount > 6) {
      fontSize = 7.2
      rowSpacing = 3.6
    }

    doc.setFont("helvetica", "normal")
    doc.setFontSize(fontSize)

    let currentItemY = itemsHeaderY + rowSpacing
    order.order_items?.forEach((item: any) => {
      const itemText = getShortItemText(item)
      // Wrap item text to fit inside card margins (cardWidth - 16 = 78mm)
      const wrappedItem = doc.splitTextToSize(itemText, cardWidth - 16)
      
      wrappedItem.forEach((line: string) => {
        // Guard to prevent printing outside the 89mm box boundary
        if (currentItemY < rowY + cardHeight - 3) {
          doc.text(line, colX + 11, currentItemY)
          currentItemY += rowSpacing
        }
      })
    })
  })

  return doc
}

