import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TiltedCard } from "./tilted-card";

interface EventType {
  id: number;
  title: string;
  image: string;
  description: string;
}

interface EventCarouselProps {
  events: EventType[];
  autoScrollSpeed?: number; // pixels per second
  gap?: number;
}

export function EventCarousel({ events, autoScrollSpeed = 50, gap = 8 }: EventCarouselProps) {
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [cardWidth, setCardWidth] = useState(isMobile ? 200 : 260);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      const newWidth = mobile ? 200 : 260;
      setCardWidth(newWidth);
      if (carouselRef.current) {
        carouselRef.current.style.setProperty('--card-width', `${newWidth}px`);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.style.setProperty('--total-width', `${events.length * (cardWidth + gap)}px`);
      carouselRef.current.style.setProperty('--gap', `${gap}px`);
      carouselRef.current.style.setProperty('--animation-play', isPaused ? 'paused' : 'running');
    }
  }, [events.length, cardWidth, gap, isPaused]);

  return (
    <div
      ref={componentRef}
      className="relative w-full overflow-hidden md:pointer-events-auto pointer-events-none"
      style={{ 
        padding: '40px 0', 
        maxWidth: '100vw'
      }}
    >
      <div 
        className="overflow-hidden md:pointer-events-auto pointer-events-none" 
        style={{ 
          width: '100%', 
          maxWidth: '100vw'
        }}
      >
        <div
          className="relative"
          ref={carouselRef}
          style={{ 
            minHeight: window.innerWidth < 768 ? '450px' : '600px',
            paddingTop: window.innerWidth < 768 ? '60px' : '100px',
            paddingBottom: window.innerWidth < 768 ? '60px' : '100px',
            width: '100%',
            overflow: 'hidden',
            pointerEvents: isMobile ? 'none' : 'auto'
          }}
        >
          <div 
            className="carousel-track"
            style={{
              display: 'flex',
              position: 'relative',
              width: 'fit-content',
              animation: 'carousel 60s linear infinite',
              animationPlayState: 'var(--animation-play, running)'
            }}
          >
            <style>
              {`
                @keyframes carousel {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(calc(-1 * var(--total-width))); }
                }
              `}
            </style>
            {[...events, ...events].map((event, index) => (
              <div
                key={`${event.id}-${index}`}
                className="flex-shrink-0"
                style={{
                  width: 'var(--card-width)',
                  marginRight: 'var(--gap)',
                  position: 'relative',
                  transformOrigin: 'center center',
                  zIndex: isPaused ? 0 : 1
                }}
                onMouseEnter={() => !isMobile && setIsPaused(true)}
                onMouseLeave={() => !isMobile && setIsPaused(false)}
              >
                <TiltedCard
                  imageSrc={event.image}
                  altText={event.title}
                  captionText={event.title}
                  containerHeight={window.innerWidth < 768 ? "300px" : "400px"}
                  containerWidth="100%"
                  imageHeight="100%"
                  imageWidth="100%"
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent={true}
                  overlayContent={
                    <div className="flex flex-col w-full h-full p-3 text-white rounded-[15px]">
                      <div className="self-end mr-4 px-3 py-2 bg-black/60 rounded-lg">
                        <h3 className="font-bold text-sm">{event.title}</h3>
                      </div>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div 
        className="absolute bottom-0 left-0 w-full h-[500px] pointer-events-none" 
        style={{ 
          background: "linear-gradient(to top, rgba(247,247,247,1) 0%, rgba(247,247,247,1) 40%, rgba(247,247,247,0) 100%)", 
          zIndex: 4 
        }}
      />
    </div>
  );
}
