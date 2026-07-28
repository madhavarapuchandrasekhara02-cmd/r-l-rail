import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react'

import { X, Plus, Minus, ShoppingBag, Truck } from 'lucide-react'
import { useCart, useUIStore } from '@/lib/store'
import { getThumbnailImage } from '@/lib/cloudinary'

export default function CartDrawer() {
  const { isCartOpen: open, setCartOpen: setOpen } = useUIStore()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { items, removeItem, updateQuantity, getTotal, getItemCount, getTotalWeight, clearCart } = useCart()
  
  const itemCount = mounted ? getItemCount() : 0
  const total = mounted ? getTotal() : 0
  const weight = mounted ? getTotalWeight() : 0

  const deliveryCharge = 0; // Free shipping as a special offer
  const freeDeliveryDiff = 0; // Always free

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-[#4A3525]/40 backdrop-blur-[2px] z-[70]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[80vw] sm:w-[420px] bg-[#FAF9F6] z-[80] shadow-[var(--shadow-xl)] transform transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E5C492]/20">
          <h2 className="text-lg font-semibold text-[#4A3525]" style={{ fontFamily: 'Lora' }}>
            Shopping Cart ({itemCount})
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 hover:bg-[#F0E6D9] rounded-xl transition-colors duration-200 cursor-pointer"
          >
            <X className="w-5 h-5 text-[#8B7355]" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <ShoppingBag className="w-16 h-16 text-[#E5C492]/50 mb-4" />
              <p className="text-[#8B7355] text-sm">Your cart is empty</p>
              <button
                onClick={() => { setOpen(false); router.push('/shop') }}
                className="mt-4 text-sm text-[#B37943] font-medium hover:underline cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Free delivery banner */}
              <div className="bg-[#5B8C5A]/10 border border-[#5B8C5A]/20 rounded-xl p-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#5B8C5A] flex-shrink-0" />
                <p className="text-xs text-[#5B8C5A]">
                  <strong>Special Offer!</strong> You get FREE delivery on this order.
                </p>
              </div>

              {/* Cart Items */}
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 pb-4 border-b border-[#E5C492]/15">
                  <div className="w-16 h-16 bg-[#F0E6D9] rounded-xl overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={64} height={64} unoptimized className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#F0E6D9]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs md:text-sm font-semibold text-[#4A3525] truncate">{item.name}</h3>
                    <p className="text-xs text-[#8B7355] mt-0.5">{item.variantLabel}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-[#F0E6D9] rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#8B7355] hover:text-[#B37943] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center text-[#4A3525]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#8B7355] hover:text-[#B37943] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-[#4A3525]">
                        Rs.{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="p-1 text-[#E5C492] hover:text-[#C44536] transition-colors duration-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}


            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E5C492]/20 p-4 space-y-3 bg-[#FAF9F6]">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#8B7355]">
                <span>Subtotal</span>
                <span>Rs.{total}</span>
              </div>
              <div className="flex justify-between items-center text-[#8B7355]">
                <span>Delivery Charge</span>
                <span className="flex items-center gap-2">
                  <span className="line-through text-gray-400 text-xs">Rs.100</span>
                  <span className="text-[#5B8C5A] font-semibold">FREE</span>
                </span>
              </div>
              <div className="flex justify-between font-semibold text-[#4A3525] text-base pt-2 border-t border-[#E5C492]/20">
                <span>Total Payable</span>
                <span>Rs.{total + deliveryCharge}</span>
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); router.push('/checkout') }}
              className="w-full py-2.5 md:py-3.5 bg-[#B37943] text-[#FAF9F6] text-xs md:text-sm font-semibold rounded-2xl hover:bg-[#96612F] transition-all duration-300 shadow-[0_4px_14px_rgba(179,121,67,0.25)] hover:shadow-[0_6px_20px_rgba(179,121,67,0.35)] cursor-pointer"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2 md:py-2.5 border border-[#E5C492]/30 text-[#8B7355] text-xs md:text-sm font-medium rounded-2xl hover:bg-[#F0E6D9] transition-colors duration-250 cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
