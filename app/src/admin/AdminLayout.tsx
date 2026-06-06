import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react'

import { LayoutDashboard, Package, ClipboardList, Boxes, Truck, LogOut, Menu, X, BarChart3, Calculator, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session, setSession] = useState<any>(null)
  const isLoginPage = location === '/admin/login' || location === '/admin/login/'

  useEffect(() => {
    if (isLoginPage) { 
      setLoading(false)
      return 
    }

    async function checkAuth() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/admin/login')
      } else {
        document.cookie = `sb-access-token=${encodeURIComponent(data.session.access_token)}; path=/; max-age=86400`
        setSession(data.session)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router, isLoginPage, location])

  useEffect(() => {
    const originalBg = document.body.style.backgroundColor
    const originalHtmlBg = document.documentElement.style.backgroundColor
    document.body.style.backgroundColor = '#FAF9F6'
    document.documentElement.style.backgroundColor = '#FAF9F6'
    return () => {
      document.body.style.backgroundColor = originalBg
      document.documentElement.style.backgroundColor = originalHtmlBg
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: Package, label: 'Products', href: '/admin/products' },
    { icon: ClipboardList, label: 'Orders', href: '/admin/orders' },
    { icon: Search, label: 'Quick Tracker', href: '/admin/tracker' },
    { icon: Boxes, label: 'Packing List', href: '/admin/packing' },
    { icon: Truck, label: 'Dispatch Center', href: '/admin/dispatch' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: Calculator, label: 'Finance & CA', href: '/admin/finance' },
  ]

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

        <nav className="flex-1 p-6 space-y-2 mt-4">
          {navItems.map((item) => (
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
                {navItems.map((item) => (
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
        <div className="flex items-center justify-between px-6 py-4">
          <div></div>
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors text-[#4A3525]"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 lg:ml-60 pt-20 lg:pt-0 min-h-screen">
        <div className="max-w-[1440px] mx-auto p-3 sm:p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  )
}
