import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCart, useUIStore } from '@/lib/store'
import { getProductImage } from '@/lib/cloudinary';

export type ProductCardProps = {
  id: string
  name: string
  slug: string
  category: string
  images: string[] | null
  minPrice: number
  maxPrice: number
  variants?: any[]
}

export default function ProductCard({ id, name, slug, category, images, minPrice, maxPrice, variants }: ProductCardProps) {
  const imageUrl = images && images.length > 0 ? images[0] : ''
  const { items, addItem, updateQuantity } = useCart()
  
  const [selectedVariant, setSelectedVariant] = useState(variants?.[0])
  const cartItem = items.find((i) => i.productId === id && (selectedVariant ? i.variantId === selectedVariant.id : true))
  const quantity = cartItem?.quantity || 0
  const [imgLoaded, setImgLoaded] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedVariant) return
    
    addItem({
      productId: id,
      variantId: selectedVariant.id,
      name: name,
      variantLabel: selectedVariant.size_label || 'Standard',
      price: selectedVariant.price,
      quantity: 1,
      image: imageUrl
    })
    
    useUIStore.getState().setCartOpen(true)
  }

  const handleUpdateQty = (e: React.MouseEvent, newQty: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (selectedVariant) {
      updateQuantity(selectedVariant.id, newQty)
    }
  }

  return (
    <div className="group bg-transparent flex flex-col h-full relative rounded-3xl hover:bg-[#F0E6D9]/50 transition-all duration-500 p-2 md:p-3 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]">
      <Link href={`/product/${slug}`} aria-label={`View ${name} — Roots & Leaves herbal product`} className="block relative aspect-[4/5] bg-[#EADCC8]/20 rounded-[1.25rem] overflow-hidden mb-2 md:mb-5 border border-[#E5C492]/15 shadow-[var(--shadow-sm)] group-hover:shadow-[var(--shadow-md)] transition-shadow duration-500">
        {imageUrl ? (
          <>
            {/* Shimmer Placeholder Background */}
            {!imgLoaded && (
              <div className="absolute inset-0 bg-[#EADCC8]/30 animate-pulse flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#B37943]/20 border-t-[#B37943] rounded-full animate-spin" />
              </div>
            )}
            <Image
              src={imageUrl}
              alt={`${name} — Roots & Leaves premium herbal ${category.replace('-', ' ')} product`}
              width={600}
              height={750}
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 300px"
              priority={false}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover object-center group-hover:scale-[1.03] transition-all duration-[600ms] ease-out ${
                imgLoaded ? 'opacity-100 blur-none' : 'opacity-0 blur-md scale-95'
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8B7355]">
            No Image
          </div>
        )}
        {/* Removed Category Label to prioritize visual clarity as requested */}
      </Link>
      
      <div className="flex flex-col flex-1 px-1">
        <Link href={`/product/${slug}`}>
          <h3 className="product-card-title text-[13px] md:text-[17px] font-serif text-[#4A3525] line-clamp-2 leading-snug group-hover:text-[#B37943] transition-colors duration-300">
            {name}
          </h3>
        </Link>
        
        <div className="mt-1 mb-2 flex items-center justify-between">
          <span className="text-base font-semibold text-[#B37943]">
            ₹{selectedVariant?.price || minPrice}
          </span>
        </div>

        {variants && variants.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5 md:gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedVariant(v); }}
                className={`px-2.5 py-1.5 md:px-3 md:py-1.5 text-[10px] md:text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all duration-250 border cursor-pointer min-h-[30px] md:min-h-0 ${
                  selectedVariant?.id === v.id
                    ? 'bg-[#4A3525] border-[#4A3525] text-[#FAF9F6] shadow-md'
                    : 'bg-transparent border-[#E5C492]/30 text-[#8B7355] hover:border-[#B37943] hover:text-[#4A3525]'
                }`}
              >
                {v.size_label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto h-9 md:h-12 relative">
          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              <motion.button
                key="add-to-cart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleAddToCart}
                className="absolute inset-0 w-full flex items-center justify-center gap-2 bg-[#B37943] text-[#FAF9F6] text-[10px] md:text-xs font-bold rounded-xl hover:bg-[#96612F] transition-all duration-300 uppercase tracking-widest shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-hover)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              >
                <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" /> Add to Cart
              </motion.button>
            ) : (
              <motion.div
                key="qty-controls"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-between bg-[#F0E6D9] rounded-xl p-1 md:p-1.5 border border-[#B37943]"
              >
                <button
                  onClick={(e) => handleUpdateQty(e, quantity - 1)}
                  className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center bg-[#FAF9F6] text-[#4A3525] rounded-lg shadow-sm hover:bg-[#E5C492]/30 transition-colors duration-200 cursor-pointer"
                >
                  <Minus className="w-3 h-3 md:w-4 md:h-4" />
                </button>
                <span className="text-xs md:text-sm font-bold text-[#4A3525]">{quantity}</span>
                <button
                  onClick={(e) => handleUpdateQty(e, quantity + 1)}
                  className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center bg-[#FAF9F6] text-[#4A3525] rounded-lg shadow-sm hover:bg-[#E5C492]/30 transition-colors duration-200 cursor-pointer"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
