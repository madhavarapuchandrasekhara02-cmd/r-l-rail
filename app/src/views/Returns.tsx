"use client";
import React from 'react'
import { motion } from 'framer-motion'
import PageWrapper from '@/components/PageWrapper'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
}


export default function RefundPolicy() {
  return (
    <PageWrapper>
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="label-luxury-small">Our Assurance</span>
            <h1 className="text-4xl md:text-5xl text-[#3B2F21] mt-6 font-serif italic">Refund Policy</h1>
          </motion.div>

          <motion.div {...fadeUp} className="space-y-12 text-[#7B6856] font-sans leading-relaxed">
            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">1. Return Eligibility</h2>
              <p>
                Due to the nature of our food and natural products, we accept returns only for damaged or defective items. Please contact us within 48 hours of receiving your order if you believe your product is damaged or defective.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">2. Non-Returnable Items</h2>
              <p>
                For health and safety reasons, we cannot accept returns of opened food products unless they are damaged or defective upon arrival.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">3. Exchange Policy</h2>
              <p>
                We do not provide any exchange of the products.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">4. Refund Process</h2>
              <p>
                Once we receive and inspect your return, we will send you an email to notify you of the approval or rejection of your refund. If approved, your refund will be credited within 7-10 business days.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">5. Damaged or Defective Products</h2>
              <p>
                If you receive a damaged or defective product, please take photos and contact us immediately at Rootsleaves2@gmail.com or call 63012 04845. We will arrange for a replacement or full refund.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">6. Contact Us</h2>
              <p>
                For refund inquiries, please contact us at Rootsleaves2@gmail.com or call 63012 04845 (Owner: SHIV SHANKAR).
              </p>

            </div>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  )
}
