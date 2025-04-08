import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { ASSETS } from '../constants/paths';
import { STORE_URLS } from '../constants/store-urls';
import { useIsVisible } from '../hooks/use-is-visible';
import { useMediaQuery } from '../hooks/use-media-query';

const gradientButtonStyles = {
  downloadGradient: 'absolute inset-0 w-full h-full bg-gradient-to-r from-[#FFCACA40] via-[#FFFACA40] to-[#CAEFFF40] opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-103 group-hover:animate-gradient-wave bg-[length:300%_100%]',
  webGradient: 'absolute inset-0 w-full h-full bg-gradient-to-r from-[#CAEFFF40] via-[#D8CAFF40] to-[#FFCACA40] opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-103 group-hover:animate-gradient-wave bg-[length:300%_100%]'
};

interface CTAButtonsProps {
  className?: string;
}

const CTAButtons: React.FC<CTAButtonsProps> = memo(({ className }) => {
  const [isSticky, setIsSticky] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsVisible(componentRef);
  const originalPositionRef = useRef<number | null>(null);
  const isMobileOrTablet = useMediaQuery('(max-width: 1024px)');

  useEffect(() => {
    const scrollContainer = document.querySelector('.snap-y');
    const handleScroll = () => {
      if (buttonRef.current) {
        if (!originalPositionRef.current) {
          originalPositionRef.current = buttonRef.current.getBoundingClientRect().top + window.scrollY;
        }

        const containerScrollTop = scrollContainer?.scrollTop || 0;
        const shouldBeSticky = containerScrollTop > originalPositionRef.current;
        
        setIsSticky(shouldBeSticky);
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleDownloadClick = () => {
    if (isMobileOrTablet) {
      // Check if user is on iOS or Android
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const storeUrl = isIOS ? STORE_URLS.APP_STORE : STORE_URLS.PLAY_STORE;
      window.open(storeUrl, '_blank');
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      {isSticky && <div style={{ height: buttonRef.current?.offsetHeight }} />}
      <motion.div
        ref={(el) => {
          buttonRef.current = el;
          componentRef.current = el;
        }}
        className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 pt-4 px-4 sm:px-0
          ${isSticky ? 'fixed top-0 left-0 right-0 z-50 py-4 px-4' : ''} ${className || ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <button 
          onClick={handleDownloadClick}
          className="relative bg-[#1A1A1A] text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105 overflow-hidden group border border-white/100 group-hover:border-white/10 duration-300"
        >
          <div className={gradientButtonStyles.downloadGradient} />
          <div className="relative z-10 flex items-center justify-center gap-2">
            <div className="flex gap-1.5 mr-1">
              <img 
                src={ASSETS.IMAGES.STORE.APP_STORE}
                alt="App Store"
                className="w-6 h-6 object-contain pointer-events-none select-none"
                draggable="false"
              />
              <img 
                src={ASSETS.IMAGES.STORE.PLAY_STORE}
                alt="Play Store"
                className="w-6 h-6 object-contain pointer-events-none select-none"
                draggable="false"
              />
            </div>
            Télécharger Genie
          </div>
        </button>
        
        <button className="relative bg-white text-[#1A1A1A] px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105 overflow-hidden group border border-black/10">
          <div className={gradientButtonStyles.webGradient} />
          <div className="relative z-10 flex items-center justify-center gap-2">
            <img 
              src={ASSETS.SVG.CONTINUE_DESKTOP}
              alt="Continue"
              className="w-5 h-5 pointer-events-none select-none"
              draggable="false"
            />
            Continuer vers le web
          </div>
        </button>
      </motion.div>
    </>
  );
});

CTAButtons.displayName = 'CTAButtons';

export default CTAButtons;
