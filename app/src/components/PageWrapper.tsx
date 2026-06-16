"use client";
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import dynamic from 'next/dynamic';
const Footer = dynamic(() => import('./Footer'), { ssr: false });
import CartDrawer from './CartDrawer';
import OrnamentalBorders from './OrnamentalBorders';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Copy, ExternalLink, X } from 'lucide-react';

/**
 * PageWrapper — Synchronizes the luxury aesthetic across the application.
 * Includes the Sandalwood background, Ornamental side borders, Navbar, and Footer.
 * Enhanced with cinematic background detailing: textures, sacred geometry, and moving light.
 * Upgraded with global in-app browser detection and transition prompt.
 */
export default function PageWrapper({ 
  children,
  className = "" 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const [isInApp, setIsInApp] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      const urlParams = new URLSearchParams(window.location.search);
      const forceMock = urlParams.get('mockInApp') === 'true';
      const forceAndroid = urlParams.get('mockAndroid') === 'true';

      // Strict detection for Instagram, Facebook (FBAV/FBAN), and YouTube in-app browsers
      const isSocial = ua.indexOf('Instagram') > -1 ||
                       ua.indexOf('FBAV') > -1 ||
                       ua.indexOf('FBAN') > -1 ||
                       ua.indexOf('YouTube') > -1 ||
                       forceMock;
      setIsInApp(isSocial);
      
      const android = /android/i.test(ua) || forceAndroid;
      setIsAndroid(android);
    }
  }, []);

  const handleOpenBrowser = () => {
    if (typeof window !== 'undefined') {
      if (isAndroid) {
        // Direct Chrome Redirect to Homepage
        window.location.href = `intent://rootsandleaves.in/#Intent;scheme=https;package=com.android.chrome;end`;
      } else {
        // iOS or other:
        // Try direct Chrome deep link to Homepage first
        window.location.href = `googlechromes://rootsandleaves.in/`;
        
        // Fallback: Redirect their current view directly to the homepage
        setTimeout(() => {
          window.location.href = `https://rootsandleaves.in/`;
        }, 200);
      }
    }
  };

  return (
    <div className={`min-h-screen relative ${className}`} style={{ background: 'var(--bg-primary)' }}>
      {/* Dynamic CSS override to collapse the Hero gap when the alert is visible */}
      {isInApp && !dismissed && (
        <style dangerouslySetInnerHTML={{__html: `
          .alert-active-adjust .hero-wrapper {
            margin-top: 12px !important;
          }
          @media (max-width: 767px) {
            .alert-active-adjust .hero-wrapper {
              margin-top: 8px !important;
            }
          }
        `}} />
      )}

      {/* Absolute Layer: Ornamental Side Borders */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <OrnamentalBorders />
      </div>

      {/* Relative Layer: Core Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Navbar />
        <CartDrawer />

        <div className={`page-content-wrapper ${!isHome ? 'with-navbar-padding' : ''} ${isInApp && !dismissed ? 'alert-active-adjust' : ''}`}>
          
          {/* World's Best UI/UX In-App Browser Escape Card (Perfectly Merged & Direct Redirect) */}
          {isInApp && !dismissed && (
            <div className="w-full px-6 pt-[68px] md:pt-[94px] pb-0 flex justify-center">
              <div className="relative w-full max-w-sm rounded-2xl border border-[#3B2F21]/10 bg-[#FAF3E8] p-4 shadow-[0_4px_24px_rgba(59,47,33,0.02)] transition-all duration-300">
                
                {/* Minimal close button */}
                <button
                  onClick={() => setDismissed(true)}
                  className="absolute right-3 top-3 w-5 h-5 flex items-center justify-center text-[#3B2F21]/45 hover:text-[#3B2F21] transition-colors cursor-pointer"
                  aria-label="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex flex-col text-center">
                  {/* Attractive, ultra-precise small text */}
                  <p className="text-[12px] md:text-xs font-sans font-medium text-[#7B6856] leading-relaxed mb-3 pr-4">
                    For smooth payments, please open this site in Chrome/Safari instead of Instagram/Facebook browser.
                  </p>

                  {/* Sandalwood brand action button */}
                  <button
                    onClick={handleOpenBrowser}
                    className="w-full h-[38px] bg-[#3B2F21] hover:bg-[#4E3E2C] text-[#F3E9D7] rounded-xl text-[11px] font-sans font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.98] flex items-center justify-center cursor-pointer border border-[#3B2F21] shadow-sm"
                  >
                    Open in Chrome/Safari
                  </button>
                </div>

              </div>
            </div>
          )}

          <main>
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
