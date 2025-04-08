import React from 'react'; 
import { motion } from 'framer-motion'; 
import { ASSETS } from '@/constants/paths';
import { useIsMobile } from '@/hooks/use-mobile';

interface TestimonialProps { 
  avatar: number; 
  name: string; 
  rating: number; 
  text: string; 
  feature: string;
  eventType?: string;
  eventDate?: string;
  eventIcon?: string;
  eventColor?: string;
}

const testimonials: TestimonialProps[] = [ 
  { 
    avatar: 2, 
    name: "Sophie L.", 
    rating: 5, 
    text: "J'ai créé une cagnotte pour mon mariage avec Genie et tout était super bien organisé. Tous nos invités ont pu participer facilement !", 
    feature: "Cagnottes",
    eventType: "Mariage",
    eventDate: "03/07/2024",
    eventIcon: "💍",
    eventColor: "#CAEFFF"
  }, 
  { 
    avatar: 1, 
    name: "Magalie R.", 
    rating: 5, 
    text: "Vraiment trop pratique. J'ai maintenant pour habitude de créer des listes de voeux à l'avance pour mes idées de cadeaux et ensuite les transférer dans les événements avec ma famille!", 
    feature: "Listes de voeux",
    eventType: "Anniversaire",
    eventDate: "09/03/2025",
    eventIcon: "🎂",
    eventColor: "#D8CAFF"
  }, 
  { 
    avatar: 6, 
    name: "Jean M.", 
    rating: 5, 
    text: "J'ai utilisé Genie pour Noël et j'ai adoré ! Ca nous à simplifié la vie à ma famille et moi pour l'achat des cadeaux !!", 
    feature: "Partage en famille",
    eventType: "Noël",
    eventDate: "25/12/2023",
    eventIcon: "🎅",
    eventColor: "#FFF3CA"
  }, 
  { 
    avatar: 3, 
    name: "Eugénie A.", 
    rating: 5, 
    text: "J'ai créé un compte géré sur Genie pour ma mère qui n'a qu'un très vieux téléphone et ça m'a permis de la faire participer à Noël.", 
    feature: "Comptes gérés",
    eventType: "Noël",
    eventDate: "25/12/2024",
    eventIcon: "🎄",
    eventColor: "#FFCACA"
  } 
];

const EventBadge: React.FC<{ 
  type: string; 
  date: string; 
  icon: string; 
  color: string;
  isParentVisible?: boolean;
  isHovered?: boolean;
}> = ({ type, date, icon, color, isParentVisible, isHovered }) => {
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={isMobile ? { x: "100vw", rotate: 5, scale: 0.7, opacity: 0 } : false}
      animate={
        isMobile 
          ? isParentVisible 
            ? { x: 0, rotate: 0, scale: 1, opacity: 1 } 
            : { x: "100vw", rotate: 0, scale: 0.7, opacity: 0 }
          : { x: 0, rotate: isMobile ? 0 : (isHovered ? 5 : 0), scale: 1, opacity: 1 }
      }
      className="absolute -top-6 -right-2 sm:right-3 lg:right-5 lg:-top-3 z-[100]"
      transition={{ 
        type: "spring",
        stiffness: 200,
        damping: 12,
        mass: 0.6,
        delay: 0.1
      }}
    >
      <div className="flex items-center gap-1 rounded-2xl bg-white border border-black/10 pl-2 shadow-sm">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg border border-black/10`} style={{ backgroundColor: color }}>
          <span className="text-xl">{icon}</span>
        </div>
        <div className="flex flex-col gap-0.5 px-2 py-2">
          <span className="text-[13px] font-semibold">{type}</span>
          <div className="bg-green-100 text-[10px] py-0.3 rounded-full px-1.5 border border-green-500/40">
            <span className="text-[12px] text-green-600">{date}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TestimonialCard: React.FC<TestimonialProps> = ({ avatar, name, rating, text, feature, eventType, eventDate, eventIcon, eventColor }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  return ( 
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, amount: 0.4 }}
      onViewportEnter={() => setIsVisible(true)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.2 }} 
      className="bg-white rounded-2xl p-8 border border-black/10 flex flex-col gap-4 relative" 
    > 
      {eventType && eventDate && eventIcon && eventColor && (
        <EventBadge 
          type={eventType} 
          date={eventDate} 
          icon={eventIcon} 
          color={eventColor}
          isParentVisible={isVisible}
          isHovered={isHovered}
        />
      )}
      <div className="flex items-center gap-4"> 
        <img src={ASSETS.IMAGES.AVATARS[`AVATAR_${avatar}` as keyof typeof ASSETS.IMAGES.AVATARS]} alt={name} className="w-12 h-12 rounded-full border-2 border-[#F7F7F7]" /> 
        <div> 
          <h3 className="font-semibold text-gray-900">{name}</h3> 
          <div className="flex items-center gap-1"> 
            <div className="flex"> 
              {[...Array(rating)].map((_, i) => ( 
                <img key={i} src={ASSETS.SVG.STAR} alt="Star Rating" className="w-4 h-4" /> 
              ))} 
            </div>
          </div>
        </div> 
      </div> 
      <p className="text-gray-600">{text}</p> 
      <div className="mt-auto flex items-center gap-1"> 
        <img src={avatar === 2 ? ASSETS.IMAGES.STORE.PLAY_STORE : ASSETS.IMAGES.STORE.APP_STORE} alt={avatar === 2 ? "Play Store" : "App Store"} className="w-3 h-3" /> 
        <span className="text-[11px] font-medium text-gray-500">Avis provenant de {avatar === 2 ? "Play Store" : "l'App Store"}</span> 
      </div> 
      <div className="absolute bottom-1.5 right-3"> 
        <span className="text-[8px] text-gray-300">*Photo non contractuelle</span> 
      </div> 
    </motion.div> 
  ); 
};

export const MobileTestimonials: React.FC = () => { 
  return ( 
    <div className="relative z-10 max-w-7xl mx-auto lg:pt-72 px-4 sm:px-6 lg:px-8 xl:px-24 pt-12"> 
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center lg:mb-24 mb-8"> 
        Nos utilisateurs adorent Genie ! 
      </h2> 
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 py-2" style={{ position: "relative", overflow: "visible" }}> 
        {testimonials.map((testimonial, index) => ( 
          <TestimonialCard key={index} {...testimonial} /> 
        ))} 
      </div> 
    </div> 
  ); 
};

export default MobileTestimonials;
