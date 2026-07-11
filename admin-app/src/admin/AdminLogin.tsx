"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react'

import { supabase } from '@/lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data.session) {
        document.cookie = `sb-access-token=${encodeURIComponent(data.session.access_token)}; path=/; max-age=86400`
        router.push('/')
      }
    } catch {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4 relative overflow-hidden botanical-grain">
      {/* Decorative botanical element */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#B37943]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#B37943]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-[#4A3525]/5 p-10 sm:p-14 border border-[#E5C492]">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[#B37943] rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg shadow-[#B37943]/20">
              <span className="text-[#FAF9F6] font-serif font-bold text-2xl">R</span>
            </div>
            <h1 className="text-3xl font-serif text-[#4A3525] mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-[#B37943] font-medium tracking-wide uppercase">
              Roots & Leaves Portal
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-[#4A3525] uppercase tracking-widest mb-2 block px-1">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rootsandleaves.com"
                className="w-full px-5 py-4 bg-[#FAF9F6]/50 border border-[#E5C492] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B37943]/20 focus:bg-white transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#4A3525] uppercase tracking-widest mb-2 block px-1">
                Security Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-[#FAF9F6]/50 border border-[#E5C492] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B37943]/20 focus:bg-white transition-all duration-200"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 text-xs py-3 px-4 rounded-xl border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 bg-[#B37943] text-white font-semibold rounded-2xl hover:bg-[#A16A54] transition-all duration-300 shadow-lg shadow-[#B37943]/20 disabled:opacity-50 active:scale-[0.98] mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : 'Access Dashboard'}
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-[#FAF9F6] text-center">
            <p className="text-[10px] text-[#B37943] font-semibold uppercase tracking-widest leading-loose">
              Operationally Efficient • Visually Cohesive<br/>
              Roots & Leaves Dashboard v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

