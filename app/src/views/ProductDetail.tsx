"use client";
import Link from 'next/link';
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Star, Plus, Minus, ShoppingCart } from 'lucide-react'
import { type Product, type ProductVariant } from '@/lib/supabase'
import { useCart, useUIStore } from '@/lib/store'
import PageWrapper from '@/components/PageWrapper'
import { getThumbnailImage, getGalleryImage } from '@/lib/cloudinary'
import { useRouter } from 'next/navigation'

export default function ProductDetail({ initialProduct }: { initialProduct?: any }) {
  // Map product_variants to variants for the UI
  const productData = initialProduct ? { ...initialProduct, variants: initialProduct.product_variants || [] } : null;
  const product = productData;
  const router = useRouter();
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(product?.variants?.[0] || null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const addItem = useCart((s) => s.addItem)
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return
    addItem({ productId: product.id, variantId: selectedVariant.id, name: product.name, variantLabel: selectedVariant.size_label, price: selectedVariant.price, quantity, image: product.images?.[0] || '' })
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      useUIStore.getState().setCartOpen(true)
    }, 600)
  }

  const handleBuyNow = () => {
    if (!product || !selectedVariant) return
    addItem({ productId: product.id, variantId: selectedVariant.id, name: product.name, variantLabel: selectedVariant.size_label, price: selectedVariant.price, quantity, image: product.images?.[0] || '' })
    router.push('/checkout')
  }

  const sections = [
    { key: 'description', label: 'Description', content: product?.description },
    { key: 'ingredients', label: 'Ingredients', content: product?.ingredients },
    { key: 'how_to_use', label: 'How to Use', content: product?.how_to_use },
    { key: 'storage', label: 'Storage Instructions', content: product?.description ? 'Store in a cool, dry place away from direct sunlight. Best consumed within 3 months of opening.' : null },
  ]

  // Loading skeleton removed because data is passed directly from the server.

  if (!product) {
    return (
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-[#4A3525] mb-4">Product not found</h1>
          <Link href="/shop" className="text-[#B37943] hover:underline cursor-pointer">Back to Shop</Link>
        </div>
      </PageWrapper>
    )
  }

  const images = product.images?.length ? product.images : ['']

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x < -50 && activeImage < images.length - 1) setActiveImage(activeImage + 1)
    else if (info.offset.x > 50 && activeImage > 0) setActiveImage(activeImage - 1)
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#8B7355] mb-6 font-sans">
          <Link href="/" className="hover:text-[#B37943] transition-colors cursor-pointer">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#B37943] transition-colors cursor-pointer">Shop</Link>
          <span>/</span>
          <span className="text-[#4A3525]">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col-reverse lg:flex-row gap-4">
            {images.length > 1 && (
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto no-scrollbar py-2 lg:py-0 lg:w-20 lg:h-[600px]">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setActiveImage(i)} className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden border-2 transition-colors cursor-pointer ${activeImage === i ? 'border-[#B37943]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={getThumbnailImage(img)} alt="Thumbnail" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative flex-1 aspect-[4/5] lg:h-[600px] bg-[#F0E6D9] rounded-3xl overflow-hidden group">
              <AnimatePresence mode="wait">
                <motion.img key={activeImage} src={getGalleryImage(images[activeImage])} alt={product.name} className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" loading="eager" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={handleDragEnd} />
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  {activeImage > 0 && (<button onClick={() => setActiveImage(activeImage - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#FAF9F6]/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><ChevronDown className="w-5 h-5 text-[#4A3525] rotate-90" /></button>)}
                  {activeImage < images.length - 1 && (<button onClick={() => setActiveImage(activeImage + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#FAF9F6]/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><ChevronDown className="w-5 h-5 text-[#4A3525] -rotate-90" /></button>)}
                </>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="label-luxury-small">{product.category}</span>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#4A3525] mt-4 mb-4">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating || 0) ? 'text-[#B37943] fill-[#B37943]' : 'text-[#E5C492]/40'}`} />))}
              </div>
              <span className="text-sm text-[#8B7355]">{product.rating || '4.5'}</span>
            </div>
            <div className="text-2xl font-bold text-[#4A3525] mb-4 font-sans">Rs.{selectedVariant?.price || 0}</div>
            
            <p className="text-[#8B7355] text-sm md:text-base leading-relaxed mb-8 whitespace-pre-line font-sans italic opacity-90">
              {product.description || 'No description available.'}
            </p>

            {product.variants.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-semibold text-[#4A3525] mb-3 block uppercase tracking-wider">Select Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant: ProductVariant) => (
                    <button key={variant.id} onClick={() => setSelectedVariant(variant)} className={`px-4 py-2 rounded-xl text-sm font-medium border-[1.5px] transition-all duration-250 cursor-pointer ${selectedVariant?.id === variant.id ? 'border-[#B37943] bg-[#B37943]/5 text-[#B37943]' : 'border-[#E5C492]/30 text-[#8B7355] hover:border-[#B37943]/50'}`}>
                      {variant.size_label} - Rs.{variant.price}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <label className="text-sm font-semibold text-[#4A3525] mb-3 block uppercase tracking-wider">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#E5C492]/30 rounded-xl bg-white/50">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-[#8B7355] hover:text-[#B37943] cursor-pointer"><Minus className="w-4 h-4" /></button>
                  <span className="w-12 text-center text-sm font-medium text-[#4A3525]">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-[#8B7355] hover:text-[#B37943] cursor-pointer"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleAddToCart} className={`flex-1 px-6 h-14 rounded-full text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${added ? 'bg-[#4A3525] text-[#FAF9F6] shadow-xl' : 'bg-[#B37943] text-[#FAF9F6] hover:bg-[#96612F] shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]'}`}>
                <ShoppingCart className="w-5 h-5" />
                {added ? 'Added to Cart!' : `Add to Cart`}
              </button>
              <button onClick={handleBuyNow} className="flex-1 px-6 h-14 rounded-full text-sm font-bold uppercase tracking-widest flex items-center justify-center transition-all duration-300 cursor-pointer bg-[#2D362E] text-[#FAF9F6] hover:bg-[#1A211B] shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]">
                Buy Now - ₹{((selectedVariant?.price || 0) * quantity)}
              </button>
            </div>

            <div className="mt-12 space-y-3">
              {sections.map((section) => (
                <div key={section.key} className="border border-[#E5C492]/20 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm transition-all duration-300">
                  <button onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F0E6D9]/50 transition-colors duration-200 cursor-pointer">
                    <span className="font-semibold text-[#4A3525] text-sm uppercase tracking-widest">{section.label}</span>
                    {expandedSection === section.key ? <ChevronUp className="w-4 h-4 text-[#8B7355]" /> : <ChevronDown className="w-4 h-4 text-[#8B7355]" />}
                  </button>
                  {expandedSection === section.key && section.content && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-6 pb-6 text-sm text-[#8B7355] leading-relaxed whitespace-pre-line font-sans">{section.content}</motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  )
}
