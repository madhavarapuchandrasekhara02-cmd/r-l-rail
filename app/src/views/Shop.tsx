"use client";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase, type Product, type ProductVariant } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import PageWrapper from '@/components/PageWrapper'
import { CATEGORY_LIST } from '@/constants/categories'

export default function Shop() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const updateSearchParams = (newParams: URLSearchParams) => {
    const query = newParams.toString() ? `?${newParams.toString()}` : '';
    router.replace(`${pathname}${query}`, { scroll: false });
  };
  const [products, setProducts] = useState<Array<Product & { variants: ProductVariant[] }>>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ all: 0, hair: 0, wellness: 0, face: 0, baby: 0 })

  const category = searchParams?.get('category') || ''
  const search = searchParams?.get('search') || ''

  // Fetch category counts once on page mount using parallel Promise.all execution
  useEffect(() => {
    async function fetchCounts() {
      try {
        const [allRes, hairRes, wellnessRes, faceRes, babyRes] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('category', 'hair-rituals'),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('category', 'wellness-rituals'),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('category', 'face-rituals'),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('category', 'baby-rituals'),
        ])

        setCounts({
          all: allRes.count || 0,
          hair: hairRes.count || 0,
          wellness: wellnessRes.count || 0,
          face: faceRes.count || 0,
          baby: babyRes.count || 0,
        })
      } catch (err) {
        console.error('Error fetching category counts:', err)
      }
    }
    fetchCounts()
  }, [])

  // Fetch product list dynamically when filters or searches change
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        let query = supabase.from('products').select(`*, product_variants(*)`, { count: 'exact' })
        if (category) query = query.eq('category', category)
        if (search) query = query.ilike('name', `%${search}%`)
        
        const { data, error } = await query
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false })
        if (error) { 
          console.error('Supabase error:', error)
          setLoading(false)
          return 
        }
        
        const mapped = (data || []).map((p: any) => ({ ...p, variants: p.product_variants || [] }))
        setProducts(mapped)
      } catch (err) { 
        console.error('Fetch products error:', err) 
      } finally { 
        setLoading(false) 
      }
    }
    fetchProducts()
  }, [category, search])

  const tabs = [
    { label: 'All', value: '', count: counts.all },
    { label: 'Hair', value: 'hair-rituals', count: counts.hair },
    { label: 'Wellness', value: 'wellness-rituals', count: counts.wellness },
    { label: 'Face', value: 'face-rituals', count: counts.face },
    { label: 'Baby', value: 'baby-rituals', count: counts.baby },
  ]


  return (
    <PageWrapper>
      <section className="pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <span className="label-luxury-small">
              Natural &amp; Handmade
            </span>
            <h1 className="text-4xl md:text-5xl text-[#4A3525] mt-4 font-serif">
              Our Rituals
            </h1>
            <p className="text-[#8B7355] max-w-xl mx-auto mt-4 font-sans">
              Explore our collection of 100% natural botanical rituals
            </p>
          </motion.div>

          {/* Tabs - Balanced 3+2 Grid on Mobile, Centered on Desktop */}
          <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-4 mb-12 px-2 sm:px-0 max-w-[380px] mx-auto md:max-w-none relative z-20">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  const currentParams = new URLSearchParams(Array.from(searchParams?.entries() || []));
                  if (tab.value) currentParams.set('category', tab.value);
                  else currentParams.delete('category');
                  updateSearchParams(currentParams);
                }}
                className={`ritual-tab !px-4 sm:!px-7 relative z-30 touch-manipulation ${
                  category === tab.value ? 'ritual-tab--active' : 'ritual-tab--inactive'
                }`}
              >
                <span className="relative z-10 pointer-events-none">{tab.label}</span>
                <span className={`relative z-10 text-[9px] px-2 py-0.5 rounded-full font-sans tracking-normal pointer-events-none ${
                  category === tab.value ? 'bg-[#FAF9F6]/20 text-[#F3E9D7]' : 'bg-[#C5A059]/10 text-[#8B7355]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-[#F0E6D9] rounded-3xl animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
              {products.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    category={product.category}
                    images={product.images}
                    minPrice={Math.min(...product.variants.map((v) => v.price))}
                    maxPrice={Math.max(...product.variants.map((v) => v.price))}
                    variants={product.variants}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#8B7355] text-lg">
                {search ? `No products found for "${search}"` : 'No products available'}
              </p>
              <button
                onClick={() => updateSearchParams(new URLSearchParams())}
                className="mt-4 text-sm text-[#B37943] hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </PageWrapper>
  )
}
