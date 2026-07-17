"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Menu, X, Home, Compass, Truck } from "lucide-react";
import { useCart, useUIStore } from "@/lib/store";

const NAV_LINKS = [
  { name: "Shop", href: "/shop" },
  { name: "Hair Ritual", href: "/shop?category=hair-rituals" },
  { name: "Wellness Ritual", href: "/shop?category=wellness-rituals" },
  { name: "Face Ritual", href: "/shop?category=face-rituals" },
  { name: "Baby Ritual", href: "/shop?category=baby-rituals" },
  { name: "About", href: "/about" },
  { name: "Track Order", href: "/track" },
];



export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const itemCount = useCart((state) => state.items.reduce((sum, i) => sum + i.quantity, 0));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav className={`navbar-editorial ${scrolled ? 'navbar-editorial--scrolled' : ''}`} role="navigation" aria-label="Main navigation — Roots & Leaves">
        <div className="navbar-inner px-4 md:px-[64px]">
          
          {/* LEFT: Logo (Desktop) / Hamburger (Mobile/Tablet) */}
          <div className="flex items-center">
            {/* Desktop Logo (Hidden on Tablet to avoid crush) */}
            <Link href="/" className="hidden xl:block" aria-label="Roots & Leaves Home">
              <img 
                src="/roots-logo.png" 
                alt="Roots & Leaves — South India's Premium Herbal Hair Wellness Brand" 
                className="transition-all duration-300 h-10 w-auto"
                style={{ height: scrolled ? '78px' : '88px' }}
              />
            </Link>

            {/* Mobile/Tablet Menu Trigger */}
            <button 
              onClick={() => setIsOpen(true)}
              className="xl:hidden p-2 -ml-2"
              aria-label="Open menu"
            >
              <Menu size={24} strokeWidth={1.5} color="#6D5A48" />
            </button>
          </div>

          {/* CENTER: Navigation (Desktop) / Logo (Mobile/Tablet) */}
          <div className="flex justify-center items-center h-full">
            {/* Desktop Navigation (XL only) */}
            <div className="hidden xl:flex items-center gap-[42px] h-full">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`nav-link-editorial relative ${isActive ? 'nav-link-editorial--active' : ''}`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Mobile/Tablet Logo (Centered) */}
            <Link href="/" className="xl:hidden" aria-label="Roots & Leaves Home">
              <img 
                src="/roots-logo.png" 
                alt="Roots & Leaves — South India's Premium Herbal Hair Wellness Brand" 
                className="h-[54px] md:h-[64px] w-auto"
              />
            </Link>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center justify-end gap-[12px] md:gap-[20px]">

            <button 
              className="p-2 hover:opacity-70 transition-opacity relative"
              onClick={() => useUIStore.getState().setCartOpen(true)}
            >
              <ShoppingCart size={20} strokeWidth={1.5} color="#3B2F21" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B89B72] text-[#FDFBF7] text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mobile-menu-panel"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-[20px] left-[16px] p-2"
              aria-label="Close menu"
            >
              <X size={24} strokeWidth={1.5} color="#6D5A48" />
            </button>

            <div className="px-[24px] flex flex-col gap-[18px]">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link"
                >
                  {link.name}
                </Link>
              ))}
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {!pathname?.startsWith('/product/') && (
        <div className="mobile-bottom-nav lg:hidden">
          <Link href="/" className={`mobile-bottom-nav-item ${pathname === '/' ? 'mobile-bottom-nav-item--active' : ''}`}>
            <Home size={20} strokeWidth={1.5} className="mb-0.5" />
            <span>Home</span>
          </Link>
          <Link href="/shop" className={`mobile-bottom-nav-item ${pathname?.startsWith('/shop') ? 'mobile-bottom-nav-item--active' : ''}`}>
            <Compass size={20} strokeWidth={1.5} className="mb-0.5" />
            <span>Shop</span>
          </Link>
          <button 
            onClick={() => useUIStore.getState().setCartOpen(true)}
            className="mobile-bottom-nav-item bg-transparent border-none outline-none"
          >
            <div className="relative flex items-center justify-center w-8 h-6">
              <ShoppingCart size={20} strokeWidth={1.5} className="mb-0.5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1 w-4 h-4 bg-[#B89B72] text-[#FDFBF7] text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm">
                  {itemCount}
                </span>
              )}
            </div>
            <span>Cart</span>
          </button>
          <Link href="/track" className={`mobile-bottom-nav-item ${pathname === '/track' ? 'mobile-bottom-nav-item--active' : ''}`}>
            <Truck size={20} strokeWidth={1.5} className="mb-0.5" />
            <span>Track</span>
          </Link>
        </div>
      )}
    </>
  );
}
