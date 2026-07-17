"use client";
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ChevronRight, ChevronDown, MapPin, Truck, CreditCard, ShieldCheck, CheckCircle2, ArrowLeft, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react'
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
  'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu',
  'Andaman and Nicobar Islands', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 
  'Jammu and Kashmir', 'Jharkhand', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
]

export default function Checkout() {
  const { items, getTotal, clearCart, updateQuantity, removeItem } = useCart()
  const [step, setStep] = useState(1) // 1: Shipping, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  })
  const [browserConfirmed, setBrowserConfirmed] = useState(false)
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false)

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

  // Auto-scroll to top on success
  useEffect(() => {
    if (step === 3) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [step])

  const handleNextStep = () => {
    const newErrors: Record<string, boolean> = {}
    if (!shippingInfo.fullName.trim()) newErrors.fullName = true
    
    // Enforce Indian Phone standard (Starts with 6-9, 10 digits)
    const phoneDigits = shippingInfo.phone.replace(/\D/g, '')
    const phoneRegex = /^[6-9]\d{9}$/
    if (!shippingInfo.phone.trim() || !phoneRegex.test(phoneDigits)) {
      newErrors.phone = true
    }

    if (!shippingInfo.address.trim()) newErrors.address = true
    if (!shippingInfo.city.trim()) newErrors.city = true
    if (!shippingInfo.state.trim()) newErrors.state = true

    // Enforce Indian Pincode standard (6 digits)
    const pinRegex = /^\d{6}$/
    if (!shippingInfo.zipCode.trim() || !pinRegex.test(shippingInfo.zipCode.trim())) {
      newErrors.zipCode = true
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstErrorField = Object.keys(newErrors)[0]
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
      return
    }
    
    setErrors({})
    setStep(step + 1)
  }
  const handlePrevStep = () => setStep(step - 1)

  const getInputClass = (field: string) => `w-full h-10 md:h-14 px-3 md:px-6 rounded-2xl bg-[#F0E6D9]/40 border ${errors[field] ? 'border-red-500 focus:border-red-600' : 'border-[#E5C492]/20 focus:border-[#B37943]'} focus:bg-white outline-none transition-all font-sans`;
  const getTextareaClass = (field: string) => `w-full p-3.5 md:p-6 rounded-2xl bg-[#F0E6D9]/40 border ${errors[field] ? 'border-red-500 focus:border-red-600' : 'border-[#E5C492]/20 focus:border-[#B37943]'} focus:bg-white outline-none transition-all font-sans resize-none`;

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      // 1. If already loaded by Next.js Script
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }

      // Check if there is already a script with that src to avoid duplicates and race conditions
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
      if (existingScript) {
        let interval = setInterval(() => {
          if ((window as any).Razorpay) {
            clearInterval(interval)
            resolve(true)
          }
        }, 100)
        setTimeout(() => {
          clearInterval(interval)
          if ((window as any).Razorpay) {
            resolve(true)
          } else {
            resolve(false)
          }
        }, 5000)
        return
      }

      // 2. Fallback: Manually inject if not found
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => {
        console.warn('Razorpay SDK failed to load. Please check your internet connection or disable adblockers.')
        resolve(false)
      }
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
        alert('Failed to load Razorpay Payment Gateway. If you are using Brave Browser, an Adblocker, or strict privacy settings, please disable shields/adblocker for this site to complete payment.')
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

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: initRes.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
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
              alert('Payment verification could not be completed. If money was deducted, your order will be confirmed automatically within a few minutes. Please do not retry the payment.')
            }
          } catch (err: any) {
            console.error('Verification error:', err)
            alert('We could not verify your payment due to a network issue. If money was deducted, your order will be confirmed automatically within a few minutes. Please do not retry the payment.')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: shippingInfo.fullName,
          email: shippingInfo.email,
          contact: normalizedPhone,
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

  useEffect(() => {
    if (step === 3) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [step])

  if (step === 3) {
    return (
      <PageWrapper>
        <section className="py-6 md:py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 bg-[#FAF3E8] border border-[#E5C492]/40 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-8 shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-[#B37943]" />
            </motion.div>
            <h1 className="text-2xl md:text-4xl text-[#4A3525] font-serif mb-3 md:mb-6">Ritual Initialized</h1>
            <p className="text-[#8B7355] text-sm md:text-lg mb-5 md:mb-8 font-sans">
              Thank you for choosing Roots & Leaves. Your sacred formulation is being prepared with care.
            </p>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="bg-gradient-to-br from-[#FAF9F6] via-[#FDFBF7] to-[#F0E6D9] border-2 border-[#E5C492] rounded-[32px] p-5 md:p-8 mb-6 md:mb-10 inline-block w-full max-w-sm mx-auto shadow-[0_20px_40px_rgba(179,121,67,0.15)] relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#B37943] via-[#E5C492] to-[#B37943] opacity-70"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#E5C492]/0 via-[#E5C492]/20 to-[#E5C492]/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-1000"></div>
              <p className="text-[10px] md:text-xs text-[#B37943] uppercase tracking-[0.4em] font-bold mb-3 relative z-10">Order ID</p>
              <div className="flex items-center justify-center relative z-10">
                <span className="text-3xl md:text-5xl text-[#4A3525] font-serif tracking-widest drop-shadow-sm select-all">#{orderNumber}</span>
              </div>
            </motion.div>
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
            <h1 className="text-2xl md:text-3xl text-[#4A3525] font-serif mb-4">Your basket is empty</h1>
            <p className="text-[#8B7355] text-sm md:text-base mb-8 font-sans">Every journey begins with a single intention.</p>
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
      <section className="pt-1 pb-12 md:py-20 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Progress Header */}
          <div className="flex items-center justify-center mb-4 md:mb-20">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#B37943]' : 'text-[#8B7355] opacity-40'}`}>
                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${step >= 1 ? 'border-[#B37943] bg-[#B37943]/10' : 'border-[#8B7355]/30'}`}>1</span>
                <span className="text-xs uppercase tracking-[0.2em] font-bold hidden md:block">Shipping</span>
              </div>
              <div className="w-8 sm:w-12 h-px bg-[#E5C492]/30" />
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
                  <motion.div key="shipping" {...fadeUp} onAnimationComplete={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="space-y-6 sm:space-y-8">
                    <div className="bg-white/60 backdrop-blur-md p-3.5 sm:p-8 md:p-12 rounded-[20px] sm:rounded-[28px] md:rounded-[40px] border border-[#E5C492]/20 shadow-xl">
                      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#B37943]" />
                        <h2 className="text-lg sm:text-2xl text-[#4A3525] font-serif">Shipping Sanctuary</h2>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">Full Name</label>
                          <input id="fullName" type="text" value={shippingInfo.fullName} onChange={e => { setShippingInfo({...shippingInfo, fullName: e.target.value}); setErrors({...errors, fullName: false}) }} className={getInputClass('fullName')} placeholder="Your name" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">Email Address <span className="lowercase text-gray-500 font-normal tracking-normal">(Optional)</span></label>
                          <input type="email" value={shippingInfo.email} onChange={e => setShippingInfo({...shippingInfo, email: e.target.value})} className={getInputClass('email')} placeholder="hello@example.com" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">Phone Number</label>
                          <input id="phone" type="tel" value={shippingInfo.phone} onChange={e => { setShippingInfo({...shippingInfo, phone: e.target.value}); setErrors({...errors, phone: false}) }} className={getInputClass('phone')} placeholder="+91" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">City</label>
                          <input id="city" type="text" value={shippingInfo.city} onChange={e => { setShippingInfo({...shippingInfo, city: e.target.value}); setErrors({...errors, city: false}) }} className={getInputClass('city')} placeholder="Bhopal" />
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-6 space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">Shipping Address</label>
                        <textarea id="address" rows={3} value={shippingInfo.address} onChange={e => { setShippingInfo({...shippingInfo, address: e.target.value}); setErrors({...errors, address: false}) }} className={getTextareaClass('address')} placeholder="House/Flat No, Street, Landmark..." />
                      </div>
                      <div className="mt-3 sm:mt-6 grid md:grid-cols-2 gap-3 sm:gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">State</label>
                          <div className="relative">
                            <button
                              id="state-trigger"
                              type="button"
                              onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
                              className={`${getInputClass('state')} flex items-center justify-between pr-4 text-left font-sans text-xs sm:text-sm text-[#4A3525] bg-[#F0E6D9]/40 cursor-pointer border ${errors.state ? 'border-red-500' : 'border-[#E5C492]/20'} rounded-2xl w-full h-10 md:h-14`}
                            >
                              <span>{shippingInfo.state || 'Select your state'}</span>
                              <ChevronDown className={`w-4 h-4 text-[#B37943] transition-transform duration-200 ${stateDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {stateDropdownOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setStateDropdownOpen(false)} 
                                />
                                <div className="absolute left-0 right-0 mt-1.5 max-h-40 overflow-y-auto bg-[#FAF9F6] border border-[#E5C492]/40 rounded-xl shadow-xl z-50 divide-y divide-[#E5C492]/10 no-scrollbar">
                                  {INDIAN_STATES.map((st) => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => {
                                        setShippingInfo({ ...shippingInfo, state: st });
                                        setErrors({ ...errors, state: false });
                                        setStateDropdownOpen(false);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-[#4A3525] hover:bg-[#F0E6D9]/40 active:bg-[#F0E6D9]/60 transition-colors font-sans"
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-[#4A3525] ml-1">Pincode</label>
                          <input id="zipCode" type="text" value={shippingInfo.zipCode} onChange={e => { setShippingInfo({...shippingInfo, zipCode: e.target.value}); setErrors({...errors, zipCode: false}) }} className={getInputClass('zipCode')} placeholder="462001" />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleNextStep}
                      className="w-full h-11 md:h-16 bg-[#B37943] text-white rounded-full font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-[11px] sm:text-xs md:text-sm hover:bg-[#96612F] shadow-[0_4px_14px_rgba(179,121,67,0.4)] hover:shadow-[0_6px_20px_rgba(179,121,67,0.6)] transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                    >
                      Continue to Review
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="payment" {...fadeUp} onAnimationComplete={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="space-y-6 sm:space-y-8">
                    <div className="bg-[#FAF8F5]/90 backdrop-blur-xl p-6 sm:p-8 md:p-12 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E5C492]/30 relative overflow-hidden">
                      {/* Decorative elements */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"></div>
                      
                      <div className="text-center mb-8 sm:mb-10">
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#B37943]/10 text-[#B37943] mb-4 sm:mb-5">
                          <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl text-[#4A3525] font-serif tracking-wide">Review & Payment</h2>
                        <p className="text-xs sm:text-sm text-[#8B7355] mt-2 sm:mt-3 font-medium">Almost there. Please review your details.</p>
                      </div>
                      
                      <div className="space-y-8">
                        {/* Section 1: Shipping Details */}
                        <div className="relative">
                          <div className="flex justify-between items-baseline mb-3 sm:mb-4">
                            <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B7355]">Shipping Details</h3>
                            <button onClick={handlePrevStep} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#B37943] hover:text-[#4A3525] transition-colors flex items-center gap-1 group">
                              Edit <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                          <div className="pb-6 sm:pb-8 border-b border-[#E5C492]/30">
                            <p className="text-lg sm:text-xl text-[#4A3525] font-serif font-medium mb-1 sm:mb-2">
                              {shippingInfo.fullName}
                            </p>
                            <p className="text-sm sm:text-[15px] text-[#6B5A4A] leading-relaxed font-sans max-w-[90%]">
                              {shippingInfo.address}, <br/>
                              {shippingInfo.city}, {shippingInfo.state} - {shippingInfo.zipCode}
                            </p>
                          </div>
                        </div>

                        {/* Section 2: Minimalist Order Summary */}
                        <div className="relative">
                          <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B7355] mb-4 sm:mb-5">Order Summary</h3>
                          <div className="pb-6 sm:pb-8 border-b border-[#E5C492]/30 space-y-3 sm:space-y-4">
                            <div className="flex justify-between text-sm sm:text-[15px] text-[#6B5A4A]">
                              <span>Subtotal</span>
                              <span className="font-medium text-[#4A3525]">₹{getTotal()}</span>
                            </div>
                            <div className="flex justify-between text-sm sm:text-[15px] text-[#6B5A4A]">
                              <span>Shipping</span>
                              <span className="font-medium text-[#B37943] uppercase tracking-wider text-xs flex items-center">Free</span>
                            </div>
                            <div className="pt-3 sm:pt-4 flex justify-between text-lg sm:text-xl font-serif">
                              <span className="text-[#4A3525]">Total to Pay</span>
                              <span className="font-bold text-[#4A3525]">₹{getTotal()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Payment Method */}
                        <div className="relative">
                           <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B7355] mb-4 sm:mb-5">Secure Payment</h3>
                           
                           {/* Luxury Razorpay Card */}
                           <div className="relative overflow-hidden p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-white to-[#FAF8F5] border border-[#E5C492]/40 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all">
                              <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full bg-blue-50/50 flex items-center justify-center border border-blue-100 shadow-inner">
                                  <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#1A56DB]" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[15px] sm:text-lg font-bold text-[#4A3525] font-serif">Razorpay Secure</p>
                                  <p className="text-xs sm:text-sm text-[#8B7355] mt-0.5 sm:mt-1">UPI / Cards / NetBanking</p>
                                </div>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1A56DB] flex items-center justify-center shadow-[0_0_10px_rgba(26,86,219,0.3)]">
                                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white"></div>
                                </div>
                              </div>
                           </div>

                           {/* Sleek Browser Checkbox */}
                           <label className="mt-6 sm:mt-8 flex items-start gap-3 sm:gap-4 cursor-pointer group bg-white/40 sm:bg-white/50 p-4 sm:p-5 rounded-xl border border-[#E5C492]/10 hover:border-[#E5C492]/30 transition-all">
                             <div className="relative flex items-center justify-center mt-0.5 sm:mt-1 shrink-0">
                               <input type="checkbox" className="sr-only" checked={browserConfirmed} onChange={(e) => setBrowserConfirmed(e.target.checked)} />
                               <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 transition-all duration-300 flex items-center justify-center ${browserConfirmed ? 'bg-[#4A3525] border-[#4A3525] shadow-[0_0_12px_rgba(74,53,37,0.3)]' : 'border-[#4A3525]/30'}`}>
                                 <CheckCircle2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white transition-opacity duration-200 ${browserConfirmed ? 'opacity-100' : 'opacity-0'}`} />
                               </div>
                             </div>
                             <p className="text-[11px] sm:text-[13px] text-[#6B5A4A] font-medium leading-relaxed select-none">
                               I confirm that I am using <strong className="text-[#4A3525] font-bold">Chrome or Safari</strong> for payment, rather than the Instagram or Facebook browser.
                             </p>
                           </label>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-3 sm:gap-4 pt-2 sm:pt-4">
                      <button onClick={handlePrevStep} className="w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-white border border-[#E5C492]/30 flex items-center justify-center text-[#4A3525] hover:bg-[#FAF8F5] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 active:scale-95 shrink-0 cursor-pointer">
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                      
                      <button 
                        onClick={placeOrder}
                        disabled={loading || !browserConfirmed}
                        className="flex-1 h-11 sm:h-16 bg-[#2A1F16] text-[#FAF8F5] rounded-full font-bold uppercase tracking-widest sm:tracking-[0.2em] text-[11px] sm:text-xs md:text-sm hover:bg-[#1A130E] shadow-[0_4px_20px_rgba(42,31,22,0.4)] hover:shadow-[0_8px_25px_rgba(42,31,22,0.6)] transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? 'Initializing Payment...' : `Complete Order • ₹${getTotal()}`}
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#E5C492]" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary Sidebar */}
            <div className={`${step === 1 ? 'block' : 'hidden'} lg:block lg:col-span-5`}>
              <div className="bg-white/40 backdrop-blur-md p-5 sm:p-8 rounded-[28px] md:rounded-[40px] border border-[#E5C492]/20 shadow-lg sticky top-24">
                <h3 className="text-xl text-[#4A3525] font-serif mb-6 sm:mb-8 pb-4 border-b border-[#EADCC8]">The Basket</h3>
                
                <div className="space-y-6 max-h-[400px] overflow-y-auto no-scrollbar mb-8 pr-2">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-4 group">
                      <div className="w-20 h-24 bg-[#F0E6D9] rounded-2xl overflow-hidden shrink-0">
                        <Image src={item.image} alt={item.name} width={80} height={96} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="text-xs md:text-sm font-bold text-[#4A3525] truncate font-serif">{item.name}</h4>
                          <p className="text-[9px] sm:text-[10px] text-[#B37943] uppercase tracking-widest font-semibold mt-1 truncate">{item.variantLabel}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 sm:gap-3">
                             <button onClick={() => updateQuantity(item.variantId, Math.max(1, item.quantity - 1))} className="text-[#8B7355] hover:text-[#B37943] p-1 -ml-1"><Minus className="w-3 h-3" /></button>
                             <span className="text-xs font-bold text-[#4A3525] w-3 sm:w-4 text-center">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="text-[#8B7355] hover:text-[#B37943] p-1"><Plus className="w-3 h-3" /></button>
                             <button onClick={() => removeItem(item.variantId)} className="ml-1 sm:ml-2 text-[#8B7355] hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
                          </div>
                          <span className="text-[13px] sm:text-sm font-bold text-[#4A3525] font-sans ml-1">₹{item.price * item.quantity}</span>
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
