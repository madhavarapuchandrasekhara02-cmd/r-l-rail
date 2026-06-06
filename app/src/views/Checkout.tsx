"use client";
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ChevronRight, MapPin, Truck, CreditCard, ShieldCheck, CheckCircle2, ArrowLeft, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import PageWrapper from '@/components/PageWrapper'
import { getThumbnailImage } from '@/lib/cloudinary'
import { trpc } from '@/providers/trpc'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
]

export default function Checkout() {
  const { items, getTotal, clearCart, updateQuantity, removeItem } = useCart()
  const [step, setStep] = useState(1) // 1: Shipping, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  })

  // tRPC mutations for payment and secure order creation
  const initiateMutation = trpc.payment.initiate.useMutation()
  const verifyMutation = trpc.payment.verifyPayment.useMutation()
  const createOrderMutation = trpc.order.create.useMutation()

  // PIN Code Auto-Resolution using our secure server-side proxy
  const pinCodeQuery = trpc.shipping.resolvePincode.useQuery(
    { pincode: shippingInfo.zipCode.trim() },
    {
      enabled: shippingInfo.zipCode.trim().length === 6 && /^\d+$/.test(shippingInfo.zipCode.trim()),
      retry: false,
      refetchOnWindowFocus: false,
    }
  )

  useEffect(() => {
    if (pinCodeQuery.data?.success) {
      setShippingInfo(prev => ({
        ...prev,
        city: pinCodeQuery.data.city || prev.city,
        state: pinCodeQuery.data.state || prev.state
      }))
    }
  }, [pinCodeQuery.data])

  // Redirect if cart is empty and not on success step
  useEffect(() => {
    if (items.length === 0 && step !== 3) {
      // Handled gracefully in render
    }
  }, [items, step])

  const handleNextStep = () => setStep(step + 1)
  const handlePrevStep = () => setStep(step - 1)

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const placeOrder = async () => {
    setLoading(true)
    try {
      // Normalize Indian phone numbers to uniform 10 digits before saving
      const cleanPhone = shippingInfo.phone.replace(/\D/g, '')
      let normalizedPhone = cleanPhone
      if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
        normalizedPhone = cleanPhone.substring(2)
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
        normalizedPhone = cleanPhone.substring(1)
      }

      console.log('[Checkout placeOrder] Normalizing Phone Number:', {
        raw: shippingInfo.phone,
        normalized: normalizedPhone
      })

      // 0. Load Razorpay Script
      const isLoaded = await loadRazorpay()
      if (!isLoaded) {
        alert('Failed to load Razorpay Payment Gateway. Please check your internet connection.')
        setLoading(false)
        return
      }

      // 1. Create Order securely in tRPC backend (Prevents price manipulation & locks taxes)
      const createRes = await createOrderMutation.mutateAsync({
        customerName: shippingInfo.fullName,
        customerPhone: normalizedPhone,
        customerEmail: shippingInfo.email || null,
        address: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        pincode: shippingInfo.zipCode,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      })

      if (!createRes.success || !createRes.orderId) {
        throw new Error(createRes.error || 'Failed to initialize secure checkout transaction')
      }

      setOrderId(createRes.orderId)
      setOrderNumber(createRes.orderNumber || '')

      // 2. Initiate Payment via Razorpay (recalculated securely on the backend)
      const initRes = await initiateMutation.mutateAsync({
        orderId: createRes.orderId,
      })

      if (!initRes.success || !initRes.razorpayOrderId) {
        throw new Error(initRes.error || 'Failed to initiate Razorpay order')
      }

      // 3. Open Razorpay Checkout Modal (Exclusively online payment with UPI priority)
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: initRes.amount,
        currency: initRes.currency,
        name: 'Roots & Leaves',
        description: 'Handcrafted Botanical Wellness',
        order_id: initRes.razorpayOrderId,
        handler: async function (response: any) {
          setLoading(true)
          try {
            // Verify payment signature securely on backend
            const verifyRes = await verifyMutation.mutateAsync({
              orderId: createRes.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })

            if (verifyRes.success) {
              setOrderId(createRes.orderId)
              setOrderNumber(createRes.orderNumber || '')
              setStep(3)
              clearCart()
            } else {
              alert(verifyRes.error || 'HMAC Signature verification failed. Payment was captured but is pending review.')
            }
          } catch (err: any) {
            console.error('Verification error:', err)
            alert('An error occurred during verification. Your payment status will be updated via webhook shortly.')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: shippingInfo.fullName,
          email: shippingInfo.email,
          contact: shippingInfo.phone,
          method: 'upi' // Focus and prioritize UPI in checkout window
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay securely via UPI (QR Code & Apps)',
                instruments: [
                  {
                    method: 'upi',
                    flows: ['qr', 'intent'] // Direct QR Code and Intent Apps at the top
                  }
                ]
              }
            },
            sequence: ['block.upi', 'block.other'], // Place UPI at the top of the payment options sequence
            preferences: {
              show_default_blocks: true
            }
          }
        },
        theme: {
          color: '#B37943'
        },
        modal: {
          ondismiss: function() {
            setLoading(false)
            alert('Payment modal closed. If money was deducted, the order will automatically be updated shortly.')
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      console.error('Order/Payment error:', err)
      alert(err.message || 'Failed to place order. Please try again.')
      setLoading(false)
    }
  }

  if (step === 3) {
    return (
      <PageWrapper>
        <section className="py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </motion.div>
            <h1 className="text-4xl text-[#4A3525] font-serif mb-6">Ritual Initialized</h1>
            <p className="text-[#8B7355] text-lg mb-10 font-sans">
              Thank you for choosing Roots & Leaves. Your order <strong>#{orderNumber}</strong> has been placed successfully and is being formulated with care.
            </p>
            <div className="space-y-4">
              <Link href="/track" className="block w-full py-4 bg-[#B37943] text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#96612F] shadow-lg transition-all">
                Track My Ritual
              </Link>
              <Link href="/" className="block w-full py-4 border border-[#B37943] text-[#B37943] rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#B37943]/5 transition-all">
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </PageWrapper>
    )
  }

  if (items.length === 0) {
    return (
      <PageWrapper>
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <ShoppingBag className="w-16 h-16 text-[#B37943]/20 mx-auto mb-6" />
            <h1 className="text-3xl text-[#4A3525] font-serif mb-4">Your basket is empty</h1>
            <p className="text-[#8B7355] mb-8 font-sans">Every journey begins with a single intention.</p>
            <Link href="/shop" className="btn-ritual-primary px-12">
              Explore Rituals
            </Link>
          </div>
        </section>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Progress Header */}
          <div className="flex items-center justify-center mb-12 md:mb-20">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#B37943]' : 'text-[#8B7355] opacity-40'}`}>
                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${step >= 1 ? 'border-[#B37943] bg-[#B37943]/10' : 'border-[#8B7355]/30'}`}>1</span>
                <span className="text-xs uppercase tracking-[0.2em] font-bold hidden md:block">Shipping</span>
              </div>
              <div className="w-12 h-px bg-[#E5C492]/30" />
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#B37943]' : 'text-[#8B7355] opacity-40'}`}>
                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${step >= 2 ? 'border-[#B37943] bg-[#B37943]/10' : 'border-[#8B7355]/30'}`}>2</span>
                <span className="text-xs uppercase tracking-[0.2em] font-bold hidden md:block">Review & Payment</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Main Form Area */}
            <div className="lg:col-span-7 space-y-8">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div key="shipping" {...fadeUp} className="space-y-8">
                    <div className="bg-white/60 backdrop-blur-md p-8 md:p-12 rounded-[40px] border border-[#E5C492]/20 shadow-xl">
                      <div className="flex items-center gap-3 mb-8">
                        <MapPin className="w-6 h-6 text-[#B37943]" />
                        <h2 className="text-2xl text-[#4A3525] font-serif">Shipping Sanctuary</h2>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">Full Name</label>
                          <input type="text" value={shippingInfo.fullName} onChange={e => setShippingInfo({...shippingInfo, fullName: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-[#F0E6D9]/40 border border-[#E5C492]/20 focus:border-[#B37943] focus:bg-white outline-none transition-all font-sans" placeholder="Your name" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">Email Address</label>
                          <input type="email" value={shippingInfo.email} onChange={e => setShippingInfo({...shippingInfo, email: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-[#F0E6D9]/40 border border-[#E5C492]/20 focus:border-[#B37943] focus:bg-white outline-none transition-all font-sans" placeholder="hello@example.com" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">Phone Number</label>
                          <input type="tel" value={shippingInfo.phone} onChange={e => setShippingInfo({...shippingInfo, phone: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-[#F0E6D9]/40 border border-[#E5C492]/20 focus:border-[#B37943] focus:bg-white outline-none transition-all font-sans" placeholder="+91" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">City</label>
                          <input type="text" value={shippingInfo.city} onChange={e => setShippingInfo({...shippingInfo, city: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-[#F0E6D9]/40 border border-[#E5C492]/20 focus:border-[#B37943] focus:bg-white outline-none transition-all font-sans" placeholder="Bhopal" />
                        </div>
                      </div>
                      <div className="mt-6 space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">Shipping Address</label>
                        <textarea rows={3} value={shippingInfo.address} onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})} className="w-full p-6 rounded-2xl bg-[#F0E6D9]/40 border border-[#E5C492]/20 focus:border-[#B37943] focus:bg-white outline-none transition-all font-sans resize-none" placeholder="House/Flat No, Street, Landmark..." />
                      </div>
                      <div className="mt-6 grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">State</label>
                          <select value={shippingInfo.state} onChange={e => setShippingInfo({...shippingInfo, state: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-[#F0E6D9]/40 border border-[#E5C492]/20 focus:border-[#B37943] focus:bg-white outline-none transition-all font-sans cursor-pointer">
                            <option value="" disabled>Select your state</option>
                            {INDIAN_STATES.map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">Pincode</label>
                          <input type="text" value={shippingInfo.zipCode} onChange={e => setShippingInfo({...shippingInfo, zipCode: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-[#F0E6D9]/40 border border-[#E5C492]/20 focus:border-[#B37943] focus:bg-white outline-none transition-all font-sans" placeholder="462001" />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleNextStep}
                      disabled={!shippingInfo.fullName || !shippingInfo.address || !shippingInfo.phone || !shippingInfo.zipCode || !shippingInfo.city}
                      className="w-full h-16 bg-[#B37943] text-white rounded-full font-bold uppercase tracking-[0.2em] text-sm hover:bg-[#96612F] shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      Continue to Review
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="payment" {...fadeUp} className="space-y-8">
                    <div className="bg-white/60 backdrop-blur-md p-8 md:p-12 rounded-[40px] border border-[#E5C492]/20 shadow-xl">
                      <div className="flex items-center gap-3 mb-8">
                        <CreditCard className="w-6 h-6 text-[#B37943]" />
                        <h2 className="text-2xl text-[#4A3525] font-serif">Review & Payment</h2>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-[#F3E9D7]/40 border border-[#E5C492]/20">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[#4A3525]">Shipping to</h3>
                            <button onClick={handlePrevStep} className="text-xs text-[#B37943] hover:underline">Change</button>
                          </div>
                          <p className="text-sm text-[#8B7355] leading-relaxed font-sans">
                            {shippingInfo.fullName}<br />
                            {shippingInfo.address}, {shippingInfo.city}, {shippingInfo.state} - {shippingInfo.zipCode}
                          </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-[#F3E9D7]/40 border border-[#E5C492]/20">
                           <h3 className="text-sm font-bold uppercase tracking-widest text-[#4A3525] mb-4">Secure Payment Method</h3>
                           <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-[#B37943] bg-white">
                              <div className="w-10 h-10 rounded-full bg-[#B37943]/10 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-[#B37943]" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#4A3525]">Razorpay Secure Checkout</p>
                                <p className="text-xs text-[#8B7355]">Instant & Secure UPI / Card payments</p>
                              </div>
                              <CheckCircle2 className="w-5 h-5 text-[#B37943] ml-auto" />
                           </div>
                           <p className="mt-4 text-[10px] text-[#8B7355] italic">
                             * All payments are securely encrypted using HMAC-SHA256 and processed with high security.
                           </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={handlePrevStep} className="w-16 h-16 rounded-full border-2 border-[#E5C492]/30 flex items-center justify-center text-[#4A3525] hover:bg-[#B37943]/5 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={placeOrder}
                        disabled={loading}
                        className="flex-1 h-16 bg-[#B37943] text-white rounded-full font-bold uppercase tracking-[0.2em] text-sm hover:bg-[#96612F] shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {loading ? 'Initializing Secure Payment...' : `Place Order & Pay - ₹${getTotal()}`}
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-5">
              <div className="bg-white/40 backdrop-blur-md p-8 rounded-[40px] border border-[#E5C492]/20 shadow-lg sticky top-24">
                <h3 className="text-xl text-[#4A3525] font-serif mb-8 pb-4 border-b border-[#EADCC8]">The Basket</h3>
                
                <div className="space-y-6 max-h-[400px] overflow-y-auto no-scrollbar mb-8 pr-2">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-4 group">
                      <div className="w-20 h-24 bg-[#F0E6D9] rounded-2xl overflow-hidden shrink-0">
                        <img src={getThumbnailImage(item.image)} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="text-sm font-bold text-[#4A3525] truncate font-serif">{item.name}</h4>
                          <p className="text-[10px] text-[#B37943] uppercase tracking-widest font-semibold mt-1">{item.variantLabel}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 scale-90 origin-left">
                             <button onClick={() => updateQuantity(item.variantId, Math.max(1, item.quantity - 1))} className="text-[#8B7355] hover:text-[#B37943]"><Minus className="w-3 h-3" /></button>
                             <span className="text-xs font-bold text-[#4A3525] w-4 text-center">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="text-[#8B7355] hover:text-[#B37943]"><Plus className="w-3 h-3" /></button>
                             <button onClick={() => removeItem(item.variantId)} className="ml-2 text-[#8B7355] hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                          </div>
                          <span className="text-sm font-bold text-[#4A3525] font-sans">₹{item.price * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-6 border-t border-[#EADCC8]">
                  <div className="flex justify-between text-sm text-[#8B7355] font-sans">
                    <span>Subtotal</span>
                    <span>₹{getTotal()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#8B7355] font-sans items-center">
                    <span className="flex items-center gap-2">
                      Shipping
                      <span className="bg-[#5B8C5A]/10 text-[#5B8C5A] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">Special Offer</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="line-through text-gray-400 text-xs">₹100</span>
                      <span className="text-[#5B8C5A] font-bold uppercase tracking-widest text-[10px]">Free</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-[#E5C492]/20">
                    <span className="text-lg text-[#4A3525] font-serif">Total</span>
                    <span className="text-2xl font-bold text-[#4A3525] font-sans">₹{getTotal()}</span>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-[#B37943]/5 border border-[#B37943]/10 flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#B37943] shrink-0" />
                  <p className="text-[10px] text-[#8B7355] leading-relaxed italic">
                    Your sacred formulations are protected. Secure checkout with end-to-end ritual integrity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
