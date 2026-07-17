'use client';
 
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ChatruvedaBadge = () => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start a 5-second timer to delay visibility
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Hide badge on admin panel or checkout page immediately
  if (pathname?.startsWith('/admin') || pathname === '/checkout') {
    return null;
  }

  const whatsappUrl = "https://wa.me/919573826186?text=Hi%20Chatruveda%20Technologies!%20I%20saw%20your%20work%20on%20Roots%20%26%20Leaves%20and%20would%20like%20to%20discuss%20a%20project.";

  return (
    <div 
      className={`hidden md:block fixed bottom-6 left-6 z-[999] group pointer-events-auto select-none transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      {/* Custom Tooltip Card */}
      <div className="absolute bottom-full left-0 mb-3 px-3 py-2 bg-[#122213] border border-[var(--footer-gold)]/30 rounded-lg text-[9px] text-[#FDFBF7] uppercase tracking-wider font-semibold whitespace-nowrap shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none flex items-center gap-1.5 z-[1000] border-solid">
        <span>Want to talk to the developer?</span>
        <span className="text-[11px] animate-bounce">💬</span>
        {/* Tooltip Arrow */}
        <div className="absolute top-full left-6 border-4 border-transparent border-t-[#122213] content-['']"></div>
      </div>

      {/* Floating Capsule Badge */}
      <a 
        href={whatsappUrl}
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--footer-gold)]/20 bg-[#122213]/90 hover:bg-[#122213] hover:border-[var(--footer-gold)]/50 text-[#FDFBF7]/80 hover:text-white transition-all duration-300 text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold shadow-lg hover:scale-105 active:scale-95 backdrop-blur-md border-solid"
      >
        <span className="text-[10px] animate-pulse">🌿</span>
        <span>Website by Chatruveda Tech</span>
      </a>
    </div>
  );
};

export default ChatruvedaBadge;
