"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Droplets, Heart, ShieldCheck, Wind, ArrowRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { supabase, type Product, type ProductVariant } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import SectionDivider from '@/components/SectionDivider'
import dynamic from 'next/dynamic'
const RitualStories = dynamic(() => import('@/components/RitualStories'), { ssr: false })
import PageWrapper from '@/components/PageWrapper'

const luxuryEase = [0.22, 1, 0.36, 1] as const

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: luxuryEase },
}

const stagger = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, delay, ease: luxuryEase },
})

const ritualCategories = [
  { name: 'Hair Ritual', slug: 'hair-rituals', desc: 'Nourish roots with sacred botanical oils.', bg: '#3B2F21', image: '/haircare.png', altText: 'Roots & Leaves herbal hair care ritual products — natural Ayurvedic hair oils South India' },
  { name: 'Wellness Ritual', slug: 'wellness-rituals', desc: 'Ancient nourishment for modern living.', bg: '#2D362E', image: '/wellness.png', altText: 'Roots & Leaves Ayurvedic wellness products — herbal bath powders and natural wellness South India' },
  { name: 'Face Ritual', slug: 'face-rituals', desc: 'Glow through timeless Ayurvedic care.', bg: '#4A4238', image: '/facecare.png', altText: 'Roots & Leaves natural face care ritual — Ayurvedic herbal face products South India' },
  { name: 'Baby Ritual', slug: 'baby-rituals', desc: 'Gentle Ayurvedic care for delicate beginnings.', bg: '#5C544A', image: '/babycare.png', altText: 'Roots & Leaves gentle herbal baby care products — natural Ayurvedic baby ritual South India' },
]




const trustPillars = [
  { icon: Droplets, title: '100% Natural', desc: 'Pure botanical formulations' },
  { icon: Heart, title: 'Handcrafted', desc: 'Small-batch artisan care' },
  { icon: ShieldCheck, title: 'Rooted in Ayurveda', desc: 'Ancient wisdom, modern ritual' },
  { icon: Wind, title: 'Cruelty Free', desc: 'No harmful synthetics' },
]

const heroSlides = [
  { title: "Sacred Rituals", image: "/HeroPage1_v2.png", alt: "Roots & Leaves premium herbal hair wellness — Sacred Ayurvedic rituals South India" },
  { title: "Luminous Glow", image: "/HeroPage2_v2.png", alt: "Roots & Leaves natural hair care products — Luminous herbal glow Andhra Pradesh Telangana" },
  { title: "Holistic Vitality", image: "/HeroPage3_v2.png", alt: "Roots & Leaves holistic Ayurvedic hair vitality — pure botanical hair oil South India" },
  { title: "Pure Tradition", image: "/HeroPage4_v2.png", alt: "Roots & Leaves traditional South Indian herbal hair care — pure handcrafted Ayurveda" },
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Array<Product & { variants: ProductVariant[] }>>([])
  const [loading, setLoading] = useState(true)
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 40 },
    [Autoplay({ delay: 8000, stopOnInteraction: false, stopOnMouseEnter: true })]
  )
  const [testimonialsRef, testimonialsApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
  )
  const [playHeroAnimation, setPlayHeroAnimation] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionKey = 'roots_leaves_hero_animated'
      const hasAnimated = sessionStorage.getItem(sessionKey)
      if (!hasAnimated) {
        setPlayHeroAnimation(true)
        sessionStorage.setItem(sessionKey, 'true')
      }
    }
  }, [])

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])
  
  const testPrev = useCallback(() => testimonialsApi && testimonialsApi.scrollPrev(), [testimonialsApi])
  const testNext = useCallback(() => testimonialsApi && testimonialsApi.scrollNext(), [testimonialsApi])
 
  // Removed manual set intervals. Embla Autoplay plugin now handles everything.

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select(`*, product_variants(*)`)
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(8)
        if (error) { console.error('Supabase error:', error); setLoading(false); return }
        const mapped = (products || []).map((p: any) => ({ ...p, variants: p.product_variants || [] }))
        setFeaturedProducts(mapped)
      } catch (err) { console.error('Fetch error:', err) }
      finally { setLoading(false) }
    }
    fetchProducts()
  }, [])

  return (
    <PageWrapper>
      {/* ═══ LUXURY EDITORIAL HERO ═══ */}
      <section className="hero-wrapper relative group" aria-label="Roots & Leaves — South India's Premium Herbal Hair Wellness Brand">
        <div className="hero-split-container">
          <div className="hero-text-side">
            <motion.div
              initial={playHeroAnimation ? { opacity: 0, y: 28 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: luxuryEase }}
            >
              <span className="label-luxury-small">Ancient Ayurvedic Rituals</span>
              <h1 className="hero-heading-responsive" style={{ color: 'var(--text-dark)', marginTop: '16px', fontWeight: 500 }}>Rooted in Ancient Rituals. Crafted for You.</h1>
              <p className="hero-p-responsive" style={{ marginTop: '20px', color: 'var(--muted-brown)', fontFamily: "'DM Sans', sans-serif", maxWidth: '380px' }}>
                Handcrafted Ayurvedic rituals made with pure botanicals, heritage wisdom, and the blessings of nature.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link href="/shop" className="btn-ritual-primary" style={{ height: '48px', padding: '0 28px', fontSize: '12px' }}>Explore Rituals</Link>
                <Link href="/about" className="btn-ritual-secondary" style={{ height: '48px', padding: '0 28px', fontSize: '12px' }}>Our Heritage</Link>
              </div>
            </motion.div>
          </div>

          <div className="hero-image-side">
            <div className="hero-banner-container">
              <div className="embla h-full" ref={emblaRef}>
                <div className="embla__container h-full">
                  {heroSlides.map((slide, index) => (
                    <div key={index} className="embla__slide relative h-full">
                      <img 
                        src={slide.image} 
                        alt={slide.alt} 
                        className="hero-banner-image" 
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "low"}
                        width={1920}
                        height={1080}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={scrollPrev} className="absolute left-6 top-1/2 -translate-y-1/2 arrow-minimal-large z-20 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#F3E9D7' }}>
              <ChevronLeft />
            </button>
            <button onClick={scrollNext} className="absolute right-6 top-1/2 -translate-y-1/2 arrow-minimal-large z-20 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#F3E9D7' }}>
              <ChevronRight />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <section className="trust-strip">
        <div className="trust-marquee-track">
          {[...trustPillars, ...trustPillars, ...trustPillars].map((item, idx) => (
            <div key={`${item.title}-${idx}`} className="flex items-center gap-6 px-12 flex-shrink-0">
              <item.icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: 'var(--soft-gold)', strokeWidth: 1.2 }} />
              <div className="flex flex-col">
                <h4 className="label-luxury-small" style={{ color: 'var(--text-dark)', opacity: 1, letterSpacing: '0.1em' }}>{item.title}</h4>
                <p className="hidden md:block" style={{ fontSize: '12px', color: 'var(--muted-brown)', fontFamily: "'DM Sans', sans-serif", marginTop: '2px' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ═══ SHOP BY RITUAL ═══ */}
      <section className="luxury-section" aria-label="Shop herbal hair care by ritual category">
        <div className="luxury-container">
          <motion.div {...fadeUp} className="text-center mb-[30px] md:mb-[40px]">
            <span className="label-luxury-small">Sacred Collections</span>
            <h2 className="text-[32px] md:text-[52px]" style={{ color: 'var(--text-dark)', marginTop: '12px' }}>Shop By Ritual</h2>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-[14px] gap-y-[14px] md:gap-8">
            {ritualCategories.map((cat, idx) => (
              <motion.div key={cat.slug} {...stagger(idx * 0.1)}>
                <Link href={`/shop?category=${cat.slug}`} className="block relative ritual-card-zoom group" style={{ backgroundColor: cat.bg }}>
                  <Image 
                    src={cat.image} 
                    alt={cat.altText} 
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    style={{ objectFit: 'cover' }}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-110" 
                    priority={idx < 2}
                  />
                  <div className="absolute inset-0 ritual-card-overlay transition-opacity group-hover:opacity-80" />

                  <div className="absolute inset-0 flex flex-col justify-end p-[14px] md:p-6 z-10">
                    <h3 className="text-lg md:text-xl font-medium text-[#EADCC8] mb-0">{cat.name}</h3>
                    <p className="hidden md:block text-[11px] text-[#EADCC8]/80 font-normal leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{cat.desc}</p>
                    <div className="mt-4 hidden md:flex items-center gap-2 text-[#EADCC8] text-xs uppercase tracking-widest font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                      Enter Ritual <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══ CURATED COLLECTIONS ═══ */}
      <section className="luxury-section">
        <div className="luxury-container">
          <motion.div {...fadeUp} className="text-center mb-[20px] md:mb-[30px]">
            <span style={{ fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--soft-gold)', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>The Apothecary</span>
            <h2 style={{ fontSize: '52px', color: 'var(--text-dark)', marginTop: '16px' }}>Curated Ritual Collections</h2>
            <p style={{ color: 'var(--muted-brown)', marginTop: '16px', maxWidth: '540px', marginInline: 'auto', fontSize: '17px', lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
              Crafted through heritage wisdom, pure botanicals, and intentional care.
            </p>
          </motion.div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-[#EADCC8]/50 rounded-[28px] aspect-[3/4]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
              {featuredProducts.map((product, idx) => (
                <motion.div key={product.id} {...stagger(idx * 0.05)}>
                  <ProductCard id={product.id} name={product.name} slug={product.slug} category={product.category} images={product.images} minPrice={Math.min(...product.variants.map((v) => v.price))} maxPrice={Math.max(...product.variants.map((v) => v.price))} variants={product.variants} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ RITUAL STORIES (CINEMATIC) ═══ */}
      <RitualStories />

      {/* ═══ RITUAL TESTIMONIALS ═══ */}
      <section className="luxury-section relative overflow-hidden" style={{ background: 'rgba(59, 47, 33, 0.03)' }} aria-label="Customer reviews and testimonials for Roots & Leaves herbal products">
        <div className="luxury-container py-0 md:py-12">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="label-luxury-small">Ritual Devotees</span>
            <h2 style={{ color: 'var(--text-dark)', marginTop: '12px' }}>Voices of the House</h2>
          </motion.div>

          <div className="embla-testimonials overflow-hidden px-4" ref={testimonialsRef}>
            <div className="embla__container flex">
              {[
                { quote: "The hair ritual oil has transformed my self-care routine. It feels like a sacred healing experience every time. The purity is unmatched.", author: "Meera K.", ritual: "Sacred Hair Rituals" },
                { quote: "Authentic Ayurveda at its finest. The sandalwood fragrance is pure bliss and my skin has never looked more radiant.", author: "Priya S.", ritual: "Radiant Skin Ritual" },
                { quote: "Handcrafted perfection. You can feel the intention and heritage in every bottle. Truly world-class.", author: "Ananya R.", ritual: "Wellness Heritage" },
                { quote: "I've tried many luxury brands, but Roots & Leaves feels different. It's grounded, pure, and incredibly effective.", author: "Rohan M.", ritual: "Earthly Rituals" },
                { quote: "The ritual of applying the body butter is the highlight of my day. It's not just skincare; it's a moment of peace.", author: "Sanjana V.", ritual: "Serene Body Ritual" },
                { quote: "Finally, a brand that respects ancient wisdom while delivering modern results. My skin feels deeply nourished.", author: "Kavita P.", ritual: "Ancient Wisdom Ritual" }
              ].map((t, idx) => (
                <div key={idx} className="flex-[0_0_100%] md:flex-[0_0_33.333%] min-w-0 px-4">
                  <div className="h-full p-8 md:p-10 bg-white/40 backdrop-blur-sm rounded-[32px] border border-var(--soft-gold)/10 shadow-[var(--shadow-sm)] flex flex-col justify-between">
                    <p className="italic font-serif text-var(--text-dark) leading-relaxed mb-8 testimonial-text-responsive">
                      "{t.quote}"
                    </p>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-[1px] w-6 bg-var(--soft-gold) opacity-30" />
                        <span className="text-[12px] uppercase tracking-widest font-semibold text-var(--soft-gold)">{t.author}</span>
                      </div>
                      <span className="block text-[10px] uppercase tracking-[0.15em] text-var(--muted-brown) opacity-70 ml-9">{t.ritual}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-6 mt-12">
             <button onClick={testPrev} className="w-12 h-12 rounded-full border border-var(--soft-gold)/20 flex items-center justify-center text-var(--soft-gold) hover:bg-var(--soft-gold) hover:text-white transition-all cursor-pointer">
               <ChevronLeft className="w-5 h-5" />
             </button>
             <button onClick={testNext} className="w-12 h-12 rounded-full border border-var(--soft-gold)/20 flex items-center justify-center text-var(--soft-gold) hover:bg-var(--soft-gold) hover:text-white transition-all cursor-pointer">
               <ChevronRight className="w-5 h-5" />
             </button>
          </div>
        </div>
      </section>

      {/* ═══ HERITAGE STORY ═══ */}
      <section className="luxury-section overflow-hidden">
        <div className="luxury-container">
          <div className="grid lg:grid-cols-2 gap-0 md:gap-12 lg:gap-20 items-center">
            {/* DESKTOP IMAGE COLUMN - Hidden on Mobile */}
            <motion.div {...fadeUp} className="hidden lg:flex justify-center items-center">
               <div className="relative w-full lg:max-w-[420px] mx-auto">
                 {/* Secondary Decorative Border */}
                 <div className="absolute -inset-4 border border-var(--soft-gold)/10 rounded-[40px]" />
                 
                 <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden bg-[#EADCC8] shadow-2xl border border-var(--soft-gold)/10 group">
                  <Image 
                    src="/home.jpg" 
                    alt="Roots & Leaves heritage Ayurvedic wisdom — traditional South Indian herbal hair care rituals" 
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    style={{ objectFit: 'cover' }}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-700" />
                 </div>
               </div>
            </motion.div>

            {/* TEXT & MOBILE IMAGE COLUMN */}
            <motion.div {...fadeUp} className="text-center lg:text-left">
               {/* Mobile Header */}
               <div className="lg:hidden mb-8">
                 <span className="label-luxury-small">Timeless Wisdom</span>
                 <h2 className="text-3xl md:text-4xl mt-3 uppercase tracking-widest text-var(--soft-gold)">Our Heritage</h2>
               </div>

               {/* MOBILE IMAGE - Between Header and Text */}
               <div className="lg:hidden mb-10">
                 <div className="relative w-full aspect-[16/10] rounded-[24px] overflow-hidden bg-[#EADCC8] shadow-xl border border-var(--soft-gold)/10">
                  <Image 
                    src="/home.jpg" 
                    alt="Roots & Leaves traditional herbal hair care — ancient South Indian Ayurvedic beauty wisdom" 
                    fill
                    sizes="100vw"
                    style={{ objectFit: 'cover' }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/5" />
                 </div>
               </div>

               {/* Desktop Header */}
               <span className="hidden lg:block label-luxury-small">Timeless Wisdom. Pure Intentions.</span>
               <h2 className="hidden lg:block text-5xl md:text-6xl text-var(--text-dark) mt-6 leading-tight font-serif italic">Our Heritage Story</h2>
               
               <div className="mt-8 md:mt-12 space-y-6 md:space-y-8">
                 <p className="text-base md:text-[19px] md:line-height-[1.9] text-var(--muted-brown) font-normal leading-relaxed font-serif">
                   In the ancient days, beauty was not a task, but a sacred ritual. Women treated their hair and skin with the same reverence as the earth itself, using pure botanical extracts, cold-pressed oils, and sun-dried herbs.
                 </p>
                 <p className="text-base md:text-[19px] md:line-height-[1.9] text-var(--muted-brown) font-normal leading-relaxed font-serif">
                   It was through these generations of whispered wisdom that they maintained their legendary knee-length, lustrous hair and radiant, healthy skin. We preserve these very secrets in every drop of Roots & Leaves, ensuring the sanctity of the past lives on in your daily self-care.
                 </p>
               </div>
               
               <div className="mt-12 md:mt-16">
                 <Link href="/shop">
                   <button className="btn-ritual-primary w-full md:w-auto px-12 h-14 text-sm uppercase tracking-[0.2em] font-bold">
                     Enter the Ritual
                   </button>
                 </Link>
               </div>
            </motion.div>
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
