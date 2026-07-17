"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react'

import { LayoutDashboard, Package, ClipboardList, Boxes, Truck, LogOut, Menu, X, BarChart3, Calculator, Search, FileText, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

import { trpc } from '@/providers/trpc'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session, setSession] = useState<any>(null)
  const isLoginPage = location === '/login' || location === '/login/'

  const { refetch: checkRole } = trpc.verifyAdmin.useQuery(undefined, {
    enabled: false,
    retry: false,
  })

  useEffect(() => {
    if (isLoginPage) { 
      setLoading(false)
      return 
    }

    async function checkAuth() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
      } else {
        // Set cookie first so the backend API can authorize the request
        document.cookie = `sb-access-token=${encodeURIComponent(data.session.access_token)}; path=/; max-age=86400`

        try {
          const res = await checkRole()
          if (res.error) throw res.error
          
          setSession(data.session)
          setLoading(false)
        } catch (err) {
          alert("Access Denied: You are not authorized to access the admin portal.")
          await supabase.auth.signOut()
          router.push('/login')
        }
      }
    }
    checkAuth()
  }, [router, isLoginPage, location, checkRole])



  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  const [showAdvanced, setShowAdvanced] = useState(false)

  const primaryNavItems = [
    { icon: Calendar, label: 'Daily Tracker', href: '/daily' },
    { icon: ClipboardList, label: 'All Orders', href: '/orders' },
    { icon: Truck, label: 'Pack and Ship', href: '/dispatch' },
    { icon: Package, label: 'Products', href: '/products' },
    { icon: Calculator, label: 'Finance & CA', href: '/finance' },
  ]

  const advancedNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Search, label: 'Quick Tracker', href: '/tracker' },
    { icon: Boxes, label: 'Packing List', href: '/packing' },
    { icon: FileText, label: 'Label Center', href: '/labels' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  ]

  const currentNav = [...primaryNavItems, ...advancedNavItems].find(item => item.href === location || (item.href !== '/' && location?.startsWith(item.href)))
  const pageTitle = currentNav?.label || 'Roots & Leaves'

  // Login page — skip layout chrome entirely
  if (isLoginPage) return <>{children}</>

  if (loading || (!session && !isLoginPage)) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B37943] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex selection:bg-[#B37943]/20 selection:text-[#B37943]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#FAF9F6] border-r border-[#E5C492] fixed h-full z-40">
        <div className="p-6 pb-4">
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          {primaryNavItems.map((item) => (
            <Link key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                location === item.href
                  ? 'bg-white text-[#B37943] shadow-sm shadow-[#B37943]/5 border border-[#E5C492]'
                  : 'text-[#6A6661] hover:text-[#B37943] hover:bg-white/50'
              }`}
            >
              <item.icon className={`w-4 h-4 ${location === item.href ? 'text-[#B37943]' : 'text-current'}`} />
              {item.label}
            </Link>
          ))}

          <div className="pt-4 pb-2">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full px-4 py-2 text-xs font-bold text-[#B37943] uppercase tracking-widest hover:bg-[#FAF3E8] rounded-lg transition-colors"
            >
              <span>{showAdvanced ? 'Hide Tools' : 'Show Advanced Tools'}</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {advancedNavItems.map((item) => (
                  <Link key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      location === item.href
                        ? 'bg-[#FAF3E8] text-[#B37943] shadow-sm shadow-[#B37943]/5 border border-[#E5C492]/50'
                        : 'text-[#8B7355] hover:text-[#B37943] hover:bg-white/50'
                    }`}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${location === item.href ? 'text-[#B37943]' : 'text-current'}`} />
                    {item.label}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <div className="p-6 border-t border-[#E5C492]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-500/80 hover:bg-red-50/50 hover:text-red-600 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-[#4A3525]/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-[#FAF9F6] z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-[#E5C492] flex items-center justify-between">
                <div></div>
                <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-white/50 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-[#B37943]" />
                </button>
              </div>

              <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                {primaryNavItems.map((item) => (
                  <Link key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${
                      location === item.href
                        ? 'bg-[#4A3525] text-[#FAF9F6] shadow-xl shadow-[#4A3525]/20'
                        : 'text-[#B37943] hover:bg-white/80 hover:text-[#4A3525]'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}

                <div className="pt-4 pb-2">
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full px-5 py-3 text-xs font-bold text-[#B37943] uppercase tracking-widest hover:bg-white/50 rounded-xl transition-colors"
                  >
                    <span>{showAdvanced ? 'Hide Tools' : 'Show Advanced Tools'}</span>
                    {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {advancedNavItems.map((item) => (
                        <Link key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-4 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                            location === item.href
                              ? 'bg-[#FAF3E8] text-[#4A3525] border border-[#E5C492]/50'
                              : 'text-[#8B7355] hover:bg-white/50 hover:text-[#B37943]'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </nav>

              <div className="p-6 border-t border-[#E5C492]">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 px-5 py-4 w-full text-sm font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-xl border-b border-[#E5C492]">
        <div className="flex items-center justify-between px-6 py-2">
          <span className="text-base font-serif font-bold text-[#4A3525] tracking-wide">{pageTitle}</span>
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors text-[#4A3525]"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 lg:ml-60 pt-24 lg:pt-0 min-h-screen">
        <div className="max-w-[1440px] mx-auto p-3 sm:p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  )
}
