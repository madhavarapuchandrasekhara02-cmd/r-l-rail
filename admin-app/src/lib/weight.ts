/**
 * Shared weight calculation utility — Single source of truth
 * 
 * Used by: dispatch API, label pages, AdminDispatch, AdminOrders, store.ts
 * 
 * Weights represent: product + container/bottle + standard packaging material
 * All values in grams.
 */

// Weight map: variant label → packed weight in grams (product + container)
const WEIGHT_MAP: Record<string, number> = {
  '50ml': 100,   '50g': 100,
  '100ml': 160,  '100g': 160,
  '150ml': 210,  '150g': 210,
  '200ml': 270,  '200g': 270,
  '250ml': 320,  '250g': 320,
  '300ml': 380,  '300g': 380,
  '500ml': 580,  '500g': 580,
  '1kg': 1150,   '1000g': 1150,
  '1l': 1150,    '1000ml': 1150,
}

/** Tare weight for packing box/bubble wrap in grams */
export const TARE_WEIGHT = 50

/** Default item weight if we can't parse the variant label */
export const DEFAULT_ITEM_WEIGHT = 250

/**
 * Get packed weight for a single item (product + container) in grams.
 * Parses the variant label string (e.g., "100ml", "250g", "500ml Combo")
 */
export function getPackedWeight(variantLabel: string): number {
  if (!variantLabel) return DEFAULT_ITEM_WEIGHT

  const lower = variantLabel.toLowerCase().trim()

  // 1. Try direct lookup first (fastest)
  for (const [key, weight] of Object.entries(WEIGHT_MAP)) {
    if (lower.includes(key)) return weight
  }

  // 2. Try regex extraction for non-standard labels
  const match = lower.match(/(\d+(?:\.\d+)?)\s*(g|ml|kg|l)\b/)
  if (match) {
    let value = parseFloat(match[1])
    const unit = match[2]
    if (unit === 'kg' || unit === 'l') value *= 1000
    // Add container/bottle weight (~50g for glass/plastic)
    return Math.round(value + 50)
  }

  // 3. Combo/kit detection
  if (lower.includes('combo') || lower.includes('kit') || lower.includes('set')) {
    return 800
  }

  return DEFAULT_ITEM_WEIGHT
}

/**
 * Detect if product is fragile (glass bottles, liquids, oils)
 */
export function isFragile(productName: string): boolean {
  const lower = (productName || '').toLowerCase()
  return (
    lower.includes('glass') ||
    lower.includes('liquid') ||
    lower.includes('oil') ||
    lower.includes('shampoo') ||
    lower.includes('rosewater') ||
    lower.includes('serum') ||
    lower.includes('toner')
  )
}

type OrderItem = {
  product_name?: string
  variant_label?: string
  quantity?: number
  hsn_code?: string
}

type PackageDetails = {
  weight: number       // total weight in grams (including tare)
  length: number       // cm
  width: number        // cm
  height: number       // cm
  fragile: boolean
  description: string
  itemCount: number
}

/**
 * Calculate full package details for an array of order items.
 * Returns total weight (with tare), dimensions, fragile flag, and description.
 */
export function getPackageDetails(items: OrderItem[]): PackageDetails {
  let totalWeight = 0
  let fragile = false
  let itemCount = 0
  const descriptions: string[] = []

  for (const item of items) {
    const qty = item.quantity || 1
    const name = item.product_name || 'Ayurvedic Product'
    const variant = item.variant_label || ''

    const itemWeight = getPackedWeight(variant)
    totalWeight += itemWeight * qty
    itemCount += qty

    if (isFragile(name)) {
      fragile = true
    }

    descriptions.push(`${name} (${variant}) x${qty}`)
  }

  // Add tare weight for packing box
  totalWeight += TARE_WEIGHT

  // Determine box dimensions based on total weight
  let length = 15, width = 10, height = 5
  if (totalWeight > 1000) { length = 30; width = 20; height = 15 }
  else if (totalWeight > 500) { length = 20; width = 15; height = 10 }

  return {
    weight: totalWeight,
    length,
    width,
    height,
    fragile,
    description: descriptions.join(', ').substring(0, 250),
    itemCount
  }
}
