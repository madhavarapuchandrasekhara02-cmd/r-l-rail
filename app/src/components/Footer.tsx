"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Instagram, Mail, MessageCircle, MapPin, ChevronDown, Youtube } from 'lucide-react';

export default function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const footerSections = [
    {
      id: 'shop',
      title: 'Quick Links',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Hair Ritual', href: '/shop?category=hair-rituals' },
        { label: 'Face Ritual', href: '/shop?category=face-rituals' },
        { label: 'About Us', href: '/about' },
        { label: 'Track Your Order', href: '/track' },
      ],
    },


    {
      id: 'company',
      title: 'Our Rituals',
      links: [
        { label: 'Hair Ritual', href: '/shop?category=hair-rituals' },
        { label: 'Face Ritual', href: '/shop?category=face-rituals' },
        { label: 'Wellness Ritual', href: '/wellness-rituals' },
        { label: 'Baby Ritual', href: '/baby-rituals' },
        { label: 'About Us', href: '/about' },
        { label: 'Track Your Order', href: '/track' },
      ],
    },



    {
      id: 'policies',
      title: 'Policies',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Refund Policy', href: '/returns' },
        { label: 'Shipping Policy', href: '/shipping' },
      ],
    },
    {
      id: 'connect',
      title: 'Connect',
      links: [
        { label: 'Instagram', href: 'https://www.instagram.com/sishika.vlogs?igsh=MWEzbzluNWk0dnhsbw==' },
        { label: 'YouTube', href: 'https://www.youtube.com/@SisHiKkA/featured' },
        { label: 'WhatsApp', href: 'https://wa.me/916301204845' },
        { label: 'Email', href: 'mailto:Rootsleaves2@gmail.com' },

      ],
    },
  ];


  return (
    <footer className="footer-ritual relative">
      {/* Premium Background Effects */}
      <div className="footer-vignette" />
      <div className="footer-logo-glow" />
      
      {/* Subtlest Grain/Manuscript Overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

      <div className="luxury-container relative z-10">
        {/* TOP AREA: Logo & Tagline */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/roots-logo.png"
            alt="Roots & Leaves — South India's Premium Herbal Hair Wellness Brand"
            className="h-10 md:h-12 w-auto object-contain brightness-0 invert opacity-90 mb-4 animate-fade-in"
          />
          <p className="text-[12px] md:text-base tracking-[0.05em] text-[#FDFBF7]/60 max-w-md font-light italic leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            “Handcrafted Ayurvedic rituals rooted in ancient Indian wisdom.”
          </p>
        </div>

        {/* MIDDLE AREA: Responsive Layout */}
        <div className="border-t border-[rgba(197,160,89,0.08)]">
          {/* Desktop Grid Layout (Hidden on Mobile) */}
          <div className="hidden md:grid grid-cols-4 gap-x-12 pt-6 pb-8 text-center">
            {footerSections.map((section) => (
              <div key={section.id} className="flex flex-col items-center space-y-4 text-center">
                <h3 className="footer-header">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        target={link.href.startsWith('http') || link.href.startsWith('mailto:') ? "_blank" : undefined}
                        rel={link.href.startsWith('http') ? "noopener noreferrer" : undefined}
                        className="footer-link"
                      >
                        {mounted ? link.label : <span className="opacity-0">{link.label}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile Accordion Layout (Hidden on Desktop) */}
          <div className="md:hidden flex flex-col pt-2">
            {footerSections.map((section) => (
              <div key={section.id} className="border-b border-[rgba(197,160,89,0.05)]">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full py-3 flex justify-between items-center text-left focus:outline-none"
                >
                  <span className="footer-header !text-[11px]">{section.title}</span>
                  <ChevronDown 
                    className={`w-3 h-3 text-[var(--footer-gold)] opacity-50 transition-transform duration-300 ${openSection === section.id ? 'rotate-180' : ''}`} 
                  />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ${openSection === section.id ? 'max-h-60 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}
                >
                  <ul className="space-y-3 px-1">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link 
                          href={link.href} 
                          target={link.href.startsWith('http') || link.href.startsWith('mailto:') ? "_blank" : undefined}
                          rel={link.href.startsWith('http') ? "noopener noreferrer" : undefined}
                          className="footer-link text-[12px]"
                        >
                          {mounted ? link.label : <span className="opacity-0">{link.label}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM STRIP */}
        <div className="footer-separator md:mt-0" />
        
        <div className="grid md:grid-cols-3 gap-8 pb-8 border-b border-[rgba(197,160,89,0.05)] text-center">
          <div className="flex flex-col items-center gap-3">
            <MapPin className="w-5 h-5 text-[var(--footer-gold)] shrink-0 mb-1" />
            <div className="space-y-1">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-[var(--footer-gold)]">Our Studio</h4>
              <p className="text-[13px] text-[#FDFBF7]/60 leading-relaxed">10-1-62, Chaitanya Nagar,<br />Gajuwaka, Andhra Pradesh 530026</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <MessageCircle className="w-5 h-5 text-[var(--footer-gold)] shrink-0 mb-1" />
            <div className="space-y-1">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-[var(--footer-gold)]">Let's Talk</h4>
              <p className="text-[13px] text-[#FDFBF7]/60 leading-relaxed">+91 63012 04845<br />+91 99493 49934</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Mail className="w-5 h-5 text-[var(--footer-gold)] shrink-0 mb-1" />
            <div className="space-y-1">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-[var(--footer-gold)]">Write to Us</h4>
              <p className="text-[13px] text-[#FDFBF7]/60 leading-relaxed">Rootsleaves2@gmail.com</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 pb-6 pt-8">
          <div className="text-[var(--footer-gold)] opacity-30 text-xl font-light">𑁍</div>
          <p className="text-[9px] md:text-[10px] uppercase tracking-[0.35em] text-[#FDFBF7]/20 font-semibold text-center">
            © 2026 Ayushyaa Foods & Naturals — Handcrafted with Intention
          </p>
        </div>
      </div>
    </footer>
  );
}

