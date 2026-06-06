"use client";
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react'
import PageWrapper from '@/components/PageWrapper'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
}

export default function Contact() {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 5000)
    setFormState({ name: '', email: '', message: '' })
  }

  return (
    <PageWrapper>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <span className="label-luxury-small">Connect With Us</span>
            <h1 className="text-4xl md:text-5xl text-[#4A3525] mt-6 font-serif">We'd Love to Hear From You</h1>
            <p className="mt-6 text-[#8B7355] font-sans">
              Whether you have a question about our rituals or just want to share your experience, our apothecary team is here to assist you.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-8">
              <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="p-8 rounded-[32px] bg-white/40 border border-[#E5C492]/20 shadow-sm">
                <h3 className="text-xl text-[#4A3525] font-serif mb-6">Our Apothecary</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#B37943]/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[#B37943]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#8B7355] mb-1">Email</p>
                      <p className="text-[#4A3525] font-medium">hello@rootsandleaves.in</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#B37943]/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-[#B37943]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#8B7355] mb-1">Phone</p>
                      <p className="text-[#4A3525] font-medium">+91 98765 43210</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#B37943]/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#B37943]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#8B7355] mb-1">Office</p>
                      <p className="text-[#4A3525] font-medium">Bhopal, Madhya Pradesh, India</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-10 pt-8 border-top border-[#E5C492]/20">
                  <p className="text-sm text-[#8B7355] italic mb-4 font-serif">Need instant help?</p>
                  <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-[#25D366] font-bold uppercase tracking-widest text-xs hover:opacity-80 transition-opacity">
                    <MessageCircle className="w-5 h-5" />
                    Chat on WhatsApp
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="p-8 md:p-12 rounded-[32px] bg-white/60 backdrop-blur-md border border-[#E5C492]/30 shadow-xl">
                {sent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                    <div className="w-20 h-20 bg-[#B37943]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Send className="w-8 h-8 text-[#B37943]" />
                    </div>
                    <h3 className="text-2xl text-[#4A3525] font-serif mb-4">Message Received</h3>
                    <p className="text-[#8B7355] font-sans">Thank you for reaching out. Our team will get back to you within 24-48 hours.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#4A3525] uppercase tracking-widest ml-1">Full Name</label>
                        <input required type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-[#F0E6D9]/50 border border-[#E5C492]/20 focus:border-[#B37943] focus:bg-white outline-none transition-all font-sans" placeholder="Your name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#4A3525] uppercase tracking-widest ml-1">Email Address</label>
                        <input required type="email" value={formState.email} onChange={e => setFormState({...formState, email: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-[#F0E6D9]/50 border border-[#E5C492]/20 focus:border-[#B37943] focus:bg-white outline-none transition-all font-sans" placeholder="hello@example.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#4A3525] uppercase tracking-widest ml-1">Your Message</label>
                      <textarea required rows={5} value={formState.message} onChange={e => setFormState({...formState, message: e.target.value})} className="w-full p-6 rounded-2xl bg-[#F0E6D9]/50 border border-[#E5C492]/20 focus:border-[#B37943] focus:bg-white outline-none transition-all font-sans resize-none" placeholder="Tell us how we can help..." />
                    </div>
                    <button type="submit" className="w-full h-16 bg-[#B37943] text-white rounded-full font-bold uppercase tracking-[0.2em] text-sm hover:bg-[#96612F] shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3">
                      Send Message
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
