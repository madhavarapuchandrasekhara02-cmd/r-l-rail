"use client";
import React from 'react'
import { motion } from 'framer-motion'
import PageWrapper from '@/components/PageWrapper'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
}


export default function ShippingPolicy() {
  const shippingRates = [
    { range: '0 – 350g', rate: '₹60' },
    { range: '351 – 750g', rate: '₹80' },
    { range: '751 – 1050g', rate: '₹120' },
    { range: '1051 – 1550g', rate: '₹150' },
    { range: '1551 – 2050g', rate: '₹180' },
    { range: '2051 – 2550g', rate: '₹200' },
    { range: '2551 – 3050g', rate: '₹220' },
    { range: '3051 – 3550g', rate: '₹240' },
    { range: '3551 – 4050g', rate: '₹260' },
    { range: '4051 – 4550g', rate: '₹280' },
    { range: '4551 – 5050g', rate: '₹300' },
  ]

  return (
    <PageWrapper>
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="label-luxury-small">The Journey of Goods</span>
            <h1 className="text-4xl md:text-5xl text-[#3B2F21] mt-6 font-serif italic">Shipping Policy</h1>
          </motion.div>

          <motion.div {...fadeUp} className="space-y-12 text-[#7B6856] font-sans leading-relaxed">
            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">1. Shipping Areas</h2>
              <p>
                We deliver all over India! Our shipping services cover all major cities and towns across the country.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">2. Delivery Time</h2>
              <p>
                Orders are typically processed within 1-2 business days. Delivery time varies based on your location:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Within Vizag: 2-4 business days</li>
                <li>Rest of India: 6-10 business days</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl text-[#3B2F21] font-serif">3. Shipping Charges</h2>
              <p>
                Shipping charges are calculated based on total product weight. Here are the delivery charge slabs:
              </p>
              <div className="overflow-hidden rounded-2xl border border-[#E5C492]/20 bg-white/30 backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#EADCC8]/50">
                      <th className="p-4 font-serif text-[#3B2F21]">Weight Range</th>
                      <th className="p-4 font-serif text-[#3B2F21]">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shippingRates.map((slab, i) => (
                      <tr key={i} className="border-t border-[#E5C492]/10 hover:bg-[#EADCC8]/20 transition-colors">
                        <td className="p-4 text-sm">{slab.range}</td>
                        <td className="p-4 text-sm font-semibold text-[#3B2F21]">{slab.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">5. Delivery Issues</h2>
              <p>
                If you experience any issues with your delivery, please contact us immediately at Rootsleaves2@gmail.com or call 63012 04845.
              </p>

            </div>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  )
}
