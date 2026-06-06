"use client";
import React from 'react'
import { motion } from 'framer-motion'
import PageWrapper from '@/components/PageWrapper'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
}


export default function PrivacyPolicy() {
  return (
    <PageWrapper>
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="label-luxury-small">Our Commitment</span>
            <h1 className="text-4xl md:text-5xl text-[#3B2F21] mt-6 font-serif italic">Privacy Policy</h1>
          </motion.div>

          <motion.div {...fadeUp} className="space-y-12 text-[#7B6856] font-sans leading-relaxed">
            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support. This may include your name, email address, phone number, shipping address, and payment information.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">2. How We Use Your Information</h2>
              <p>
                We use the information we collect to process your orders, communicate with you about your purchases, send promotional emails (with your consent), and improve our products and services.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">3. Information Sharing</h2>
              <p>
                We do not sell or rent your personal information to third parties. We may share your information with service providers who assist us in operating our website and conducting our business.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl text-[#3B2F21] font-serif">5. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at Rootsleaves2@gmail.com or call 63012 04845.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  )
}
