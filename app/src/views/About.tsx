"use client";
import React from 'react'
import { motion } from 'framer-motion'
import { Droplets, Heart, ShieldCheck, Sparkles, Leaf, Wind } from 'lucide-react'
import PageWrapper from '@/components/PageWrapper'

const luxuryEase = [0.22, 1, 0.36, 1] as const

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: luxuryEase }
}

export default function About() {
  return (
    <PageWrapper>
      {/* ═══ PURPOSE & HERITAGE ═══ */}
      <section className="luxury-section overflow-hidden pt-12 md:pt-20 pb-16">
        <div className="luxury-container">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8 md:space-y-12">
            
            {/* Header Block */}
            <motion.div {...fadeUp} className="space-y-4">
              <span className="label-luxury-small">Our Sacred Journey</span>
              <h1 className="text-2xl md:text-5xl text-[#4A3525] font-serif italic leading-tight">
                Rooted in Tradition,<br />Crafted for You
              </h1>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center w-full">
              {/* DESKTOP IMAGE COLUMN - Framed & Curated */}
              <motion.div {...fadeUp} className="hidden lg:flex justify-center items-center">
                 <div className="relative w-full lg:max-w-[440px] mx-auto">
                   {/* Secondary Decorative Border */}
                   <div className="absolute -inset-5 border border-[#B37943]/10 rounded-[44px]" />
                   
                   <div className="relative w-full aspect-[4/5] rounded-[36px] overflow-hidden bg-[#EADCC8] shadow-2xl border border-[#E5C492]/10 group">
                    <img 
                      src="/about.jpg" 
                      alt="Roots & Leaves Ayurvedic heritage — traditional South Indian botanical hair care wisdom and pure herbal ingredients" 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-700" />
                   </div>
                 </div>
              </motion.div>

              {/* MOBILE IMAGE - Full Width & Framed */}
              <motion.div {...fadeUp} className="lg:hidden w-full px-4">
                <div className="relative w-full aspect-square rounded-[24px] overflow-hidden bg-[#FDFBF7] shadow-lg border-2 border-[#E5C492]/20 p-2">
                  <div className="w-full h-full rounded-[18px] overflow-hidden border border-[#E5C492]/10">
                    <img 
                      src="/about.jpg" 
                      alt="Roots & Leaves ancestral herbal wisdom — traditional South Indian women's Ayurvedic hair care rituals" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </motion.div>

              {/* TEXT COLUMN */}
              <motion.div {...fadeUp} className="text-center lg:text-left space-y-6 md:space-y-8">
                 <div className="space-y-4 md:space-y-6">
                   <p className="text-sm md:text-[17px] text-[#8B7355] leading-relaxed font-serif">
                     At Roots & Leaves, our purpose is deeply rooted in the preservation of old and natural Ayurvedic wisdom. We believe that true beauty is not manufactured; it is cultivated through the ancient knowledge of botanical extracts, sun-dried herbs, and the intentional care that only nature can provide.
                   </p>
                   <p className="text-sm md:text-[17px] text-[#8B7355] leading-relaxed font-serif">
                     Our mission is to bring this forgotten sanctity back to every home and every woman in India. We meticulously source our ingredients from the very same lands our ancestors tread, ensuring that the ancient wisdom and sacred knowledge of healing plants feel like home once more.
                   </p>
                   <p className="text-sm md:text-[17px] text-[#8B7355] leading-relaxed font-serif italic opacity-80">
                     Through Roots & Leaves, we strive to make this timeless heritage unforgettable, reaching the heart of every household with the pure, ancestral touch of traditional Ayurveda.
                   </p>
                 </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PILLARS OF THE HOUSE ═══ */}
      <section className="luxury-section bg-[#FDFBF7]/50 backdrop-blur-sm">
        <div className="luxury-container">
          <div className="text-center mb-12 md:mb-24">
            <span className="label-luxury-small">The Foundation</span>
            <h2 className="text-2xl md:text-5xl text-[#4A3525] mt-6 font-serif italic">Sacred Principles</h2>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 md:gap-12">
            {[
              { icon: Droplets, title: 'Botanical Purity', desc: 'Every formulation uses old, natural extracts.' },
              { icon: Heart, title: 'Conscious Intent', desc: 'Small-batch preparation with ancestral reverence.' },
              { icon: ShieldCheck, title: 'Ancient Wisdom', desc: 'Preserving forgotten secrets for every home.' },
              { icon: Wind, title: 'Pure Air & Soil', desc: 'Sourcing from pristine Indian lands at peak potency.' },
              { icon: Sparkles, title: 'Sacred Ritual', desc: 'Transforming daily care into a moment of healing.' },
              { icon: Leaf, title: 'Earth Heritage', desc: 'Sustainable rituals that honor woman and soil.' }
            ].map((pillar, i) => (
              <motion.div 
                key={i} 
                {...fadeUp} 
                transition={{ delay: i * 0.1, duration: 0.8, ease: luxuryEase }}
                className="p-3 md:p-10 rounded-[16px] md:rounded-[36px] bg-white/40 border border-[#E5C492]/20 hover:border-[#B37943]/40 transition-all duration-500 group text-center"
              >
                <div className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-[#FDFBF7] shadow-sm flex items-center justify-center mx-auto mb-2 md:mb-8 group-hover:scale-110 transition-transform duration-500">
                  <pillar.icon className="w-4 h-4 md:w-7 md:h-7 text-[#B37943]" />
                </div>
                <h3 className="text-[8px] md:text-2xl text-[#4A3525] font-serif mb-0 md:mb-4 italic line-clamp-2 md:line-clamp-none leading-tight">{pillar.title}</h3>
                <p className="hidden md:block text-[#8B7355] text-sm leading-relaxed font-sans tracking-wide">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
