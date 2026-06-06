"use client";
import React from 'react'
import { motion } from 'framer-motion'
import PageWrapper from '@/components/PageWrapper'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
}


export default function TermsOfService() {
  return (
    <PageWrapper>
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="label-luxury-small">The Sacred Covenant</span>
            <h1 className="text-4xl md:text-5xl text-[#3B2F21] mt-6 font-serif italic">Terms of Service</h1>
          </motion.div>

          <motion.div {...fadeUp} className="space-y-12 text-[#7B6856] font-sans leading-relaxed">
            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Ayushyaa Foods & Naturals website, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials on Ayushyaa's website for personal, non-commercial transitory viewing only.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">3. Product Information</h2>
              <p>
                We strive to provide accurate product information. However, we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">4. Pricing</h2>
              <p>
                All prices are subject to change without notice. We reserve the right to modify or discontinue products without notice.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">5. Contact Information</h2>
              <p>
                For any questions regarding these Terms of Service, please contact us at Rootsleaves2@gmail.com or call 63012 04845.
              </p>

            </div>

            <div className="space-y-4 pt-8 border-t border-[#E5C492]/20">
              <h2 className="text-2xl text-[#3B2F21] font-serif">6. Owner Details</h2>
              <div className="space-y-2">
                <p><span className="font-semibold">Owner Name:</span> SHIV SHANKAR</p>
                <p><span className="font-semibold">Phone Number:</span> 63012 04845</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  )
}
