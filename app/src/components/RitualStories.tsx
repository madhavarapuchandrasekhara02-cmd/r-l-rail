"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination, Navigation } from 'swiper/modules';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight, Instagram, Youtube } from 'lucide-react';
import InstagramButton from './InstagramButton';
import YouTubeButton from './YouTubeButton';


// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

/**
 * ═══ RITUAL STORIES: CINEMATIC PERFECTION ═══
 * 
 * DESIGN PHILOSOPHY:
 * - Visibility Aware: Only plays when section is in view.
 * - Mouse/Touch Intelligence: Adapts stop logic based on input device.
 * - Optimized Tablet View: Refined aspect ratio and narrower columns.
 * - Custom Navigation: Elegant luxury arrows for tactile control.
 * - Initial Focus: Starts from the second story for immediate impact.
 */

const YOUTUBE_SHORT_IDS = [
  "RM485oUuOhg",
  "xQknAlRnaM4",
  "5WZoRVINXW4",
  "CGrm1Iu6Otw",
  "RvIgpcHUFWc"
];

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

function RitualStoryCard({ 
  id, 
  index, 
  isMobile = false,
  isActive = false,
  isMouseDevice = false,
  isSectionInView = false
}: { 
  id: string; 
  index: number; 
  isMobile?: boolean;
  isActive?: boolean;
  isMouseDevice?: boolean;
  isSectionInView?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  const [hasUserClicked, setHasUserClicked] = useState(false);
  
  // Reset click state when slide becomes inactive on mobile
  useEffect(() => {
    if (isMobile && !isActive) {
      setHasUserClicked(false);
    }
  }, [isActive, isMobile]);

  const shouldPlay = isSectionInView && (isMobile ? (isActive && hasUserClicked) : (isMouseDevice ? isHovered : false));

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      setHasUserClicked(!hasUserClicked);
    } else if (playerRef.current && isVideoLoaded) {
      if (isPaused) {
        playerRef.current.playVideo();
        setIsPaused(false);
      } else {
        playerRef.current.pauseVideo();
        setIsPaused(true);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initPlayer = () => {
      if (!mounted || !videoRef.current || playerRef.current) return;

      try {
        playerRef.current = new window.YT.Player(videoRef.current, {
          videoId: id,
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0,
            iv_load_policy: 3,
            disablekb: 1,
            playsinline: 1,
            loop: 1,
            playlist: id,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (mounted) {
                event.target.playVideo();
                setIsVideoLoaded(true);
                event.target.unMute();
                event.target.setVolume(100);
              }
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                event.target.playVideo();
              }
            }
          },
        });
      } catch (error) {
        console.error("YouTube Player Init Error:", error);
      }
    };

    if (shouldPlay) {
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        // Load API if not already loading
        if (!document.getElementById('youtube-api-script')) {
          const tag = document.createElement('script');
          tag.id = 'youtube-api-script';
          tag.src = "https://www.youtube.com/iframe_api";
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        // Set callback or check periodically
        const checkYT = setInterval(() => {
          if (window.YT && window.YT.Player) {
            initPlayer();
            clearInterval(checkYT);
          }
        }, 100);
        return () => clearInterval(checkYT);
      }
    } else {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
      setIsVideoLoaded(false);
      setIsPaused(false);
    }

    return () => {
      mounted = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [shouldPlay, id]);

  return (
    <motion.div
      suppressHydrationWarning
      className={`ritual-story-card relative overflow-hidden rounded-[32px] bg-[#2D241A] shadow-[0_12px_24px_rgba(74,53,37,0.08)] border border-[#E5C492]/20 group cursor-pointer z-10 transition-all duration-500 
        ${isMobile ? 'h-[380px] sm:h-[420px] w-full mx-auto' : 'aspect-[9/16] w-full'}
        ${isMobile && !isActive ? 'opacity-100 scale-90 blur-[1px]' : 'opacity-100 scale-100 blur-0'}
      `}
      initial={isMobile ? { opacity: 0, y: 30 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: isMobile ? "-100px" : "0px" }}
      transition={{ delay: isMobile ? 0 : index * 0.1, duration: 0.8 }}
      whileHover={!isMobile ? {
        scale: 1.05,
        y: -24,
        zIndex: 50,
        boxShadow: "0 32px 64px rgba(74, 53, 37, 0.2)",
        transition: { type: "spring", stiffness: 300, damping: 20 }
      } : {}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleTogglePlay}
    >
      <div className="relative aspect-[9/16] w-full h-full overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img
            src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
            alt="Ritual Story Thumbnail"
            className="w-full h-full object-cover grayscale-[20%] transition-all duration-700 scale-[1.10] group-hover:scale-115"
          />
        </div>

        <AnimatePresence>
          {shouldPlay && !isVideoLoaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FCFAF5]"
            >
              <motion.img
                src="/roots-logo.png"
                alt="Loading..."
                className="w-24 h-auto opacity-70"
                animate={{
                  scale: [0.95, 1.05, 0.95],
                  opacity: [0.4, 0.8, 0.4]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {shouldPlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isVideoLoaded ? 1 : 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 z-30 w-full h-full bg-[#FCFAF5]"
          >
            <div 
              ref={videoRef}
              className="absolute inset-0 w-full h-full border-0 scale-[1.35] pointer-events-none select-none"
              style={{ 
                clipPath: 'inset(10px 10px 10px 10px)',
                filter: 'contrast(1.02) brightness(1.02)',
              }}
            />
            <div className="absolute inset-0 z-40 bg-transparent" />
            
            <AnimatePresence>
              {isPaused && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px]"
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                    <Play size={24} fill="white" color="white" className="ml-1" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {isMobile && !hasUserClicked && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-14 h-14 rounded-full bg-white/20 border border-white/40 flex items-center justify-center"
            >
              <Play size={20} fill="white" color="white" className="ml-1" />
            </motion.div>
          </div>
        )}
        
        <div className="absolute inset-0 z-50 bg-gradient-to-t from-[#4A3525]/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-50 border-[1.5px] border-[#E5C492]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[32px] pointer-events-none shadow-[inset_0_0_40px_rgba(229,196,146,0.1)]" />
      </div>
    </motion.div>
  );
}

export default function RitualStories() {
  const [activeMobileIndex, setActiveMobileIndex] = useState(1);
  const [isMouseDevice, setIsMouseDevice] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { amount: 0.2 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = () => {
      setIsMouseDevice(true);
      window.removeEventListener('mousemove', handleMouseMove);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section ref={sectionRef} className="luxury-section overflow-hidden bg-[#FCFAF5] relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6.png")', backgroundColor: '#FAF8F3' }} />
      <div className="luxury-container">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-20">
          <span className="label-luxury-small !text-[#B37943]">Ritual Stories</span>
          <h2 className="text-4xl md:text-6xl text-[#4A3525] mt-6 font-serif italic tracking-tight leading-tight px-4">
            Cinematic Heritage. Captured in Motion.
          </h2>
        </div>

        {/* Desktop View: Full-Width 5-Column Grid */}
        <div className={`hidden lg:grid grid-cols-5 gap-6 lg:gap-8 relative pb-20 transition-opacity duration-1000 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
          {isMounted && YOUTUBE_SHORT_IDS.map((id, index) => (
            <RitualStoryCard 
              key={id} 
              id={id} 
              index={index} 
              isMouseDevice={isMouseDevice}
              isSectionInView={isInView}
            />
          ))}
        </div>

        {/* Tablet & Mobile View: Centered Luxury Carousel with Navigation Arrows */}
        <div className={`lg:hidden relative px-4 transition-opacity duration-1000 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
          {isMounted && (
            <Swiper
              modules={[Pagination, Navigation]}
              centeredSlides={true}
              initialSlide={1}
              slidesPerView={1.3}
              spaceBetween={20}
              onSlideChange={(swiper) => setActiveMobileIndex(swiper.activeIndex)}
              navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
              }}
              breakpoints={{
                640: {
                  slidesPerView: 2.2,
                  spaceBetween: 30,
                }
              }}
              className="ritual-stories-swiper !pb-8 !pt-2"
            >
              {YOUTUBE_SHORT_IDS.map((id, index) => (
                <SwiperSlide key={id} className="py-[5px]">
                  <RitualStoryCard 
                    id={id} 
                    index={index} 
                    isMobile={true} 
                    isActive={activeMobileIndex === index}
                    isMouseDevice={isMouseDevice}
                    isSectionInView={isInView}
                  />
                </SwiperSlide>
              ))}

              {/* Custom Luxury Navigation Arrows */}
              <div className="swiper-button-prev-custom absolute left-0 top-[40%] -translate-y-1/2 z-[60] cursor-pointer">
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md border border-[#E5C492]/30 flex items-center justify-center shadow-lg"
                >
                  <ChevronLeft size={20} className="text-[#4A3525]" />
                </motion.div>
              </div>
              <div className="swiper-button-next-custom absolute right-0 top-[40%] -translate-y-1/2 z-[60] cursor-pointer">
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md border border-[#E5C492]/30 flex items-center justify-center shadow-lg"
                >
                  <ChevronRight size={20} className="text-[#4A3525]" />
                </motion.div>
              </div>
            </Swiper>
          )}
        </div>
        
        {/* Luxury Social Links: Royal & Rich Redesign */}
        <div className="mt-6 md:mt-10 pb-10 flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 px-4">
          <InstagramButton 
            href="https://www.instagram.com/sishika.vlogs?igsh=MWEzbzluNWk0dnhsbw==" 
            label="Explore Rituals"
            className="w-full sm:w-auto"
          />
          <YouTubeButton 
            href="https://www.youtube.com/@SisHiKkA/featured" 
            label="Join Community"
            className="w-full sm:w-auto"
          />

        </div>

      </div>

      <style jsx global>{`

        .swiper-button-disabled {
          opacity: 0.2;
          pointer-events: none;
        }
      `}</style>
    </section>
  );
}
