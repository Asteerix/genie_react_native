import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ASSETS } from "../../constants/paths";
import StoreCarousel from "./storecarousel";

interface BentoItemProps {
  className: string;
  children?: React.ReactNode;
  description?: string;
  noAnimation?: boolean;
  isTopTile?: boolean;
}

interface BentoGridProps {
  children?: React.ReactNode;
}

export const BentoItem: React.FC<BentoItemProps> = ({ className, children, description, noAnimation = false, isTopTile = false }) => {
  const [isFlipped, setIsFlipped] = useState<boolean | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const autoFlipTimeoutRef = useRef<NodeJS.Timeout>();
  const isMobileRef = useRef(false);

  useEffect(() => {
    isMobileRef.current = window.matchMedia('(max-width: 1024px)').matches;
    if (isInView && !noAnimation && isMobileRef.current && description && isTopTile) {
      // Start with description showing
      setIsFlipped(true);
      // Flip back to front after delay (now stays flipped for 2 seconds)
      autoFlipTimeoutRef.current = setTimeout(() => {
        setIsFlipped(false);
      }, 2000);
    }
    return () => {
      if (autoFlipTimeoutRef.current) {
        clearTimeout(autoFlipTimeoutRef.current);
      }
    };
  }, [isInView, noAnimation, description]);

  if (noAnimation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`${className} relative bg-white rounded-3xl border border-black/10 p-0`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`${className} group`}
      style={{ perspective: "2000px" }}
    >
      <div 
        className="relative w-full h-full transform-gpu transition-all duration-500 ease-out-back"
        onClick={() => setIsFlipped(!isFlipped)}
        onMouseEnter={() => !window.matchMedia('(max-width: 1024px)').matches && setIsFlipped(true)}
        onMouseLeave={() => !window.matchMedia('(max-width: 1024px)').matches && setIsFlipped(false)}
      >
        <div 
          className={`w-full h-full transition-transform duration-500 ease-out-back ${isFlipped === null ? "" : isFlipped ? "rotate-y-180" : ""}`}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div 
            className="absolute inset-0 bg-white rounded-3xl border border-black/10 transition-all duration-500 will-change-transform overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {children}
          </div>
          <div 
            className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl p-4 border border-black/10 rotate-y-180 flex items-center justify-center text-center transition-all duration-500 will-change-transform"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-m font-medium text-gray-800 px-4">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const BentoGrid: React.FC<BentoGridProps> = ({ children }) => (
  <div 
    className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 h-full lg:h-[650px] z-0" 
  >
    {children}
  </div>
);

export const BentoGridExample = () => {
  const descriptions = {
    wishlists: "Crée et organise facilement tes listes de souhaits pour toutes les occasions",
    friends: "Retrouve et connecte-toi avec tes proches pour partager vos envies",
    duplicates: "Les cadeaux réservés sont automatiquement marqués pour éviter les doublons",
    events: "Organise et participe à +40 differents pré-fabriqués événements et créer les tiens",
    collaborative: "Rassemble famille et amis pour contribuer ensemble à des cadeaux importants et réaliser les grands vœux",
    sharing: "Partage facilement tes souhaits avec ta famille et tes amis",
    supervised: "Gère les comptes des plus jeunes en toute sécurité",
    ai: "Notre IA t'aide à trouver le cadeau idéal en fonction des goûts de chacun"
  };

  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // We'll determine if we should hide the main phone image on smaller screens
  // Only show on larger screens to save space
  const shouldHideMainPhone = screenWidth < 1024;
  
  // Force single column on phone screens, two columns on tablet-sized screens

  return (
    <div className="relative w-full max-w-7xl mx-auto py-8 max-[560px]:px-16 max-[450px]:px-10 max-[375px]:px-4 px-3 sm:px-6 min-[650px]:px-20 h-auto lg:h-[650px]">
      {/* Adjusted breakpoints to use xs (or none) for smaller screens */}
      <div className="grid grid-cols-1 max-[560px]:grid-cols-1 min-[560px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 h-full lg:h-[650px]">
        {/* Crée des listes */}
        <BentoItem 
          className="col-span-1 row-span-1 lg:row-span-2 min-h-[200px] lg:h-full"
          description={descriptions.wishlists}
          isTopTile={true}
        >
          <div className="flex flex-col h-full">
            <div className="px-2 pt-2">
              <h3 className="text-base md:text-lg lg:text-xl font-bold p-3">Crée des <br />listes</h3>
            </div>
            <div className="flex-grow relative">
              <img 
                src={ASSETS.IMAGES.WISHLISTS_SCREEN}
                alt="Crée des listes"
                className="absolute bottom-0 right-0 lg:h-[96%] h-[205%] object-contain pointer-events-none select-none"
                draggable="false"
              />
            </div>
          </div>
        </BentoItem>
        
        {/* Retrouve tes amis et familles */}
        <BentoItem 
          className="col-span-1 min-h-[200px] lg:h-full"
          description={descriptions.friends}
        >
          <div className="flex flex-col items-center h-auto">
            <h3 className="text-base md:text-lg lg:text-xl font-bold text-center mt-7">
            Envoie et reçois de <br />l'argent en un clic
            </h3>
            <div className="flex-grow flex items-center justify-center w-full">
              <img 
                src={ASSETS.IMAGES.ACCEPT_FRIEND}
                alt="Accept friend"
                className="w-[90%] object-contain pointer-events-none select-none"
                draggable="false"
              />
            </div>
          </div>
        </BentoItem>

        {/* Fini les doublons */}
        <BentoItem 
          className="col-span-1 min-h-[200px] lg:h-full"
          description={descriptions.duplicates}
        >
          <div className="flex flex-col h-full p-3">
            <div className="flex-grow flex items-center justify-center">
              <img 
                src={ASSETS.IMAGES.RESERVED_GIFT}
                alt="Fini les doublons"
                className="object-contain absolute left-0 w-[60%] md:w-[60%] lg:w-[85%] sm:w-[60%] pointer-events-none select-none"
                draggable="false"
              />
            </div>
            <div className="text-center">
              <h3 className="text-base md:text-lg lg:text-xl font-bold mt-0 p-5">Fini les doublons !</h3>
            </div>
          </div>
        </BentoItem>
        
        {/* Participe à des événements */}
        <BentoItem 
          className="col-span-1 row-span-1 lg:row-span-2 min-h-[200px] lg:h-full"
          description={descriptions.events}
        >
          <div className="flex flex-col h-full">
            <div className="p-2">
              <h3 className="text-base md:text-lg lg:text-xl font-bold p-3">
                Participe à des<br />événements
              </h3>
            </div>
            <div className="flex-grow relative mt-2">
              <img 
                src={ASSETS.IMAGES.EVENT_SCREEN}
                alt="Participe à des événements"
                className="absolute bottom-0 right-0 lg:h-[110%] sm:h-[165%] md:h-[240%] h-[255%] xs:h-[255%] object-contain pointer-events-none select-none"
                draggable="false"
              />
            </div>
          </div>
        </BentoItem>
        
        {/* Main phone image - Hide on smaller screens using Tailwind classes and conditional rendering */}
        <BentoItem 
          className={`col-span-1 row-span-1 md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2 min-h-[300px] md:h-full ${
            shouldHideMainPhone ? "hidden" : ""
          }`} 
          description="Découvre une nouvelle façon de gérer tes cadeaux" 
          noAnimation={true}
        >
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl">
            <img 
              src={ASSETS.IMAGES.HANDWITHPHONE}
              alt="Hand holding phone"
              className="h-auto max-h-[115%] w-auto object-contain sm:-mt-10 pointer-events-none select-none"
              draggable="false"
            />
          </div>
        </BentoItem>
        
        {/* Cadeaux Collaboratifs */}
        <BentoItem 
          className="col-span-1 row-span-1 lg:row-span-2 min-h-[200px] lg:h-full"
          description={descriptions.collaborative}
        >
          <div className="flex flex-col lg:flex-col items-center h-full max-lg:flex-row max-lg:p-4">
            <h3 className="text-base md:text-lg lg:text-xl font-bold text-center lg:p-5 max-lg:text-right">
              Cadeaux et<br />Cagnottes<br />Collaboratives
            </h3>
            <div className="flex-grow flex items-center justify-center lg:mt-4 max-lg:order-first">
              <img 
                src={ASSETS.IMAGES.COLLABORATIVE_GIFTS}
                alt="Cadeaux et Cagnottes Collaboratifs"
                className="w-[80%] object-contain pointer-events-none select-none"
                draggable="false"
              />
            </div>
          </div>
        </BentoItem>
        
        {/* Partage tes vœux */}
        <BentoItem 
          className="col-span-1 min-h-[200px] lg:h-full"
          description={descriptions.sharing}
        >
          <div className="relative h-full overflow-hidden">
            <h3 className="text-base md:text-lg lg:text-xl font-bold p-6">
              Partage<br />tes vœux
            </h3>
            <img 
              src={ASSETS.IMAGES.SHARE_WISHES}
              alt="Partage tes vœux"
              className="absolute bottom-0 right-0 h-[100%] object-contain pointer-events-none select-none"
              draggable="false"
            />
          </div>
        </BentoItem>
        
        {/* Comptes gérés */}
        <BentoItem 
          className="col-span-1 min-h-[200px] lg:h-full"
          description={descriptions.supervised}
        >
          <div className="relative h-full overflow-hidden">
            <h3 className="text-base md:text-lg lg:text-xl font-bold p-6">
              Comptes<br />gérés
            </h3>
            <img 
              src={ASSETS.IMAGES.SUPERVISED_ACCOUNTS}
              alt="Comptes gérés"
              className="absolute bottom-0 right-0 h-[80%] object-contain pointer-events-none select-none"
              draggable="false"
            />
          </div>
        </BentoItem>
        
        {/* Trouve le cadeau parfait */}
        <BentoItem 
          className="col-span-1 min-h-[200px] lg:col-span-2 lg:h-full"
          description={descriptions.ai}
        >
          <div className="relative h-full overflow-hidden">
            <h3 className="text-base md:text-lg lg:text-xl font-bold p-6">
              Trouve le cadeau parfait grâce à l'IA !
            </h3>
              <StoreCarousel />
          </div>
        </BentoItem>
      </div>
    </div>
  );
};

export default BentoGridExample;
