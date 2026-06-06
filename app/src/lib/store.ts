import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  productId: string
  variantId: string
  name: string
  variantLabel: string
  price: number
  quantity: number
  image: string
}

type CartStore = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, qty: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  getTotalWeight: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.variantId === item.variantId)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({ items: [...get().items, item] })
        }
      },
      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) })
      },
      updateQuantity: (variantId, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.variantId !== variantId) })
        } else {
          set({
            items: get().items.map((i) =>
              i.variantId === variantId ? { ...i, quantity: qty } : i
            ),
          })
        }
      },
      clearCart: () => set({ items: [] }),
      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalWeight: () =>
        get().items.reduce((sum, i) => {
          const weightMatch = i.variantLabel.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l)/i)
          if (weightMatch) {
            let w = parseFloat(weightMatch[1])
            const unit = weightMatch[2].toLowerCase()
            if (unit === 'kg' || unit === 'l') w *= 1000
            return sum + w * i.quantity
          }
          return sum + 100 * i.quantity
        }, 0),
    }),
    { name: 'roots-leaves-cart' }
  )
)
