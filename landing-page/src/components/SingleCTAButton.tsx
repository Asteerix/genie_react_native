import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ASSETS } from '../constants/paths';

const useIsVisible = (ref: React.RefObject<HTMLElement>) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref]);

  return isVisible;
};

const SingleCTAButton: React.FC = () => {
  const [isSticky, setIsSticky] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsVisible(componentRef);
  const originalPositionRef = useRef<number | null>(null);

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

  return (
    <>
      {isSticky && <div style={{ height: buttonRef.current?.offsetHeight }} />}
      <motion.div
        ref={(el) => {
          buttonRef.current = el;
          componentRef.current = el;
        }}
        className={`flex justify-center mb-16 pt-4 px-4 sm:px-0
          ${isSticky ? 'fixed top-0 left-0 right-0 z-50 py-4 px-4' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <button className="relative bg-white text-[#1A1A1A] px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105 overflow-hidden group border border-black/10">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#CAEFFF40] via-[#D8CAFF40] to-[#FFCACA40] opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-103 group-hover:animate-gradient-wave bg-[length:300%_100%]" />
          <div className="relative z-10 flex items-center justify-center gap-2">
            <img 
              src={ASSETS.SVG.CONTINUE_DESKTOP}
              alt="Continue"
              className="w-5 h-5 pointer-events-none select-none"
              draggable="false"
            />
            Utiliser Genie sur la version web
          </div>
        </button>
      </motion.div>
    </>
  );
};

export default SingleCTAButton;
