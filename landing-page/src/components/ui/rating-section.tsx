import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ASSETS } from '../../constants/paths';

const useIsVisible = (ref: React.RefObject<HTMLElement>) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
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

const RatingSection = () => {
  const componentRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsVisible(componentRef);
  const avatars = [1, 2, 3, 4, 5];

  return (
    <motion.div
      ref={componentRef}
      className="flex flex-col sm:flex-row items-center justify-center gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {avatars.map((index) => (
            <img
              key={index}
              src={ASSETS.IMAGES.AVATARS[`AVATAR_${index}`]}
              alt={`User ${index}`}
              className="w-6 h-6 rounded-full border-2 border-color-[#F7F7F7]"
            />
          ))}
        </div>
        
        <div className="flex items-center gap-1">
          <span className="font-bold text-[#F3B604]">4.8</span>
          <img 
            src={ASSETS.SVG.STAR}
            alt="Star Rating"
            className="w-4 h-4"
          />
        </div>
      </div>

      <span className="text-gray-600 text-sm font-semibold mt-2 sm:mt-0">+10k utilisateurs ravis</span>
    </motion.div>
  );
};

export default RatingSection;
