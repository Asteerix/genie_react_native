import React, { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ASSETS } from "../../constants/paths";

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

interface Feature {
  step: string;
  title?: string;
  content: string;
  image: string;
}

interface FeatureStepsProps {
  features: Feature[];
  className?: string;
  title?: string;
  autoPlayInterval?: number;
  imageHeight?: string;
}

export function FeatureSteps({
  features,
  className,
  title,
  autoPlayInterval = 3000,
  imageHeight = "h-[400px]",
}: FeatureStepsProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<(HTMLDivElement | null)[]>([]);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const lastScrollTime = useRef<number>(0);
  const isMobile = useIsMobile();
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    const handleScroll = () => {
      if (isHovering || isLargeScreen) return;

      const now = Date.now();
      if (now - lastScrollTime.current < 50) return; // Debounce scrolling
      lastScrollTime.current = now;
      
      let closestFeature = { index: 0, distance: Infinity };
      
      featuresRef.current.forEach((featureEl, index) => {
        if (!featureEl) return;
        
        const rect = featureEl.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const windowCenter = window.innerHeight / 2;
        const distance = Math.abs(elementCenter - windowCenter);
        
        if (distance < closestFeature.distance) {
          closestFeature = { index, distance };
        }
      });

      if (closestFeature.distance < 150) {
        setCurrentFeature(closestFeature.index);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHovering, features.length, isLargeScreen]);

  const handleTitleClick = (index: number) => {
    setCurrentFeature(index);
  };

  return (
    <motion.div 
      ref={componentRef}
      className={cn("pt-0 pb-16 px-8 md:px-12 md:pb-24", className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center space-y-4 mb-10 lg:mb-16">
          {title && (
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              {title}
            </h2>
          )}
        </div>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="order-2 md:order-1 space-y-6 flex flex-col items-center md:items-end">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                ref={el => featuresRef.current[index] = el}
                className="flex items-center gap-6 md:gap-8 cursor-pointer w-full md:w-auto will-change-transform"
                initial={false}
                animate={{ 
                  opacity: index === currentFeature ? 1 : 0.5,
                  scale: index === currentFeature ? 1.02 : 0.99,
                  y: index === currentFeature ? -4 : 0
                }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  mass: 0.5
                }}
                layout
                onClick={() => handleTitleClick(index)}
                onMouseEnter={() => {
                  if (isLargeScreen) {
                    setIsHovering(true);
                    setCurrentFeature(index);
                  }
                }}
                onMouseLeave={() => {
                  if (isLargeScreen) {
                    setIsHovering(false);
                  }
                }}
              >
                <motion.div
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2",
                    index === currentFeature
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-muted border-muted-foreground"
                  )}
                >
                    <img 
                      src={index === 0 
                        ? ASSETS.SVG.FEATURES.FIND_GIFTS
                        : index === 1
                        ? ASSETS.SVG.FEATURES.CREATE_WISHLISTS
                        : index === 2
                        ? ASSETS.SVG.FEATURES.EVENTS
                        : index === 3
                        ? ASSETS.SVG.FEATURES.RESERVE_GIFTS
                        : index === 4
                        ? ASSETS.SVG.FEATURES.POTS
                        : ASSETS.SVG.FEATURES.SHARE_MOMENTS
                      }
                      className={cn(
                        "w-5 h-5 transition-all pointer-events-none select-none",
                        index === currentFeature
                          ? "brightness-0 invert"
                          : ""
                      )}
                      alt=""
                      draggable="false"
                    />
                </motion.div>

                <div className="flex-1 md:max-w-[430px]">
                  <h3 className="text-XS md:text-lg font-semibold">
                    {feature.title || feature.step}
                  </h3>
                  <p className="text-sm md:text-sm text-muted-foreground">
                    {feature.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="hidden md:flex order-1 md:order-2 justify-center">
            <div className="relative h-[200px] md:h-[600px] w-full md:w-[300px]">
              {/* iPhone frame - desktop only */}
              <div className="hidden md:block absolute inset-0 z-10">
                <img
                  src={ASSETS.IMAGES.IPHONE}
                  alt="iPhone frame"
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable="false"
                />
              </div>
              {/* Content container with screen content */}
              <div className="md:scale-[0.94] relative h-full w-full overflow-hidden rounded-lg md:rounded-none md:scale-[1.1]">
                <AnimatePresence mode="wait">
                  {features.map(
                    (feature, index) =>
                      index === currentFeature && (
                        <motion.div
                          key={index}
                          className="absolute inset-0 rounded-lg overflow-hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                            mass: 0.5
                          }}
                        >
                          <img
                            src={feature.image}
                            alt={feature.step}
                            className="w-full h-full object-contain transform pointer-events-none select-none"
                            draggable="false"
                          />
                        </motion.div>
                      )
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
