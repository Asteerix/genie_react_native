import React, { useRef, useEffect } from 'react';

interface Store {
  id: number;
  name: string;
  logo: string;
}

const stores: Store[] = [
  { id: 1, name: 'Amazon', logo: '/assets/images/shopping-stores/amazon.jpg' },
  { id: 2, name: 'Nike', logo: '/assets/images/shopping-stores/nike.jpg' },
  { id: 3, name: 'Lego', logo: '/assets/images/shopping-stores/lego.jpg' },
  { id: 4, name: 'Zara', logo: '/assets/images/shopping-stores/zara.jpg' },
  { id: 5, name: 'Apple', logo: '/assets/images/shopping-stores/apple.jpg' },
  { id: 6, name: 'Diesel', logo: '/assets/images/shopping-stores/diesel.jpg' },
  { id: 7, name: 'Temu', logo: '/assets/images/shopping-stores/temu.jpg' },
  { id: 8, name: 'Adidas', logo: '/assets/images/shopping-stores/adidas.jpg' },
  { id: 9, name: 'Uniqlo', logo: '/assets/images/shopping-stores/uniqlo.jpg' },
  { id: 10, name: 'Sephora', logo: '/assets/images/shopping-stores/sephora.jpg' },
  { id: 11, name: 'Shein', logo: '/assets/images/shopping-stores/shein.jpg' },
  { id: 12, name: 'Zalando', logo: '/assets/images/shopping-stores/zalando.jpg' },
  { id: 13, name: 'Etsy', logo: '/assets/images/shopping-stores/etsy.jpg' },
  { id: 14, name: 'Toys R Us', logo: '/assets/images/shopping-stores/toysrus.jpg' },
  { id: 15, name: 'Asos', logo: '/assets/images/shopping-stores/asos.jpg' },
  { id: 16, name: 'H&M', logo: '/assets/images/shopping-stores/handm.jpg' },
  { id: 17, name: 'Fnac', logo: '/assets/images/shopping-stores/fnac.jpg' },
  { id: 18, name: 'Maisons du Monde', logo: '/assets/images/shopping-stores/maisons-du-monde.jpg' },
  { id: 19, name: 'Cdiscount', logo: '/assets/images/shopping-stores/cdiscount.jpg' },
  { id: 20, name: 'Wonderbox', logo: '/assets/images/shopping-stores/wonderbox.jpg' }
];

const SCROLL_SPEED = 0.5;
const CARD_WIDTH = 100; // Width of card + margin

const StoreCarousel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const scrollPositionRef = useRef(0);
  
  // Preload images
  useEffect(() => {
    stores.forEach(store => {
      const img = new Image();
      img.src = store.logo;
    });
  }, []);

  useEffect(() => {
    const animate = () => {
      if (!containerRef.current) return;

      scrollPositionRef.current -= SCROLL_SPEED;
      
      // If a store has moved completely out of view on the left
      if (scrollPositionRef.current <= -CARD_WIDTH) {
        // Reset position to create infinite loop effect
        scrollPositionRef.current += CARD_WIDTH;
        
        // Move first element to the end
        const firstChild = containerRef.current.firstElementChild;
        if (firstChild) {
          containerRef.current.appendChild(firstChild);
        }
      }

      // Apply the transform
      containerRef.current.style.transform = `translateX(${scrollPositionRef.current}px)`;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Create enough duplicates for smooth scrolling
  const duplicateStores = [...stores, ...stores];

  return (
    <div className="w-full bg-transparent overflow-hidden">
      <div className="relative">
        <div
          ref={containerRef}
          className="flex space-x-2 px-2 pt-4 sm:pt-0 will-change-transform"
          style={{ transform: 'translateX(0)' }}
        >
          {duplicateStores.map((store, index) => (
            <div
              key={`${store.id}-${index}`}
              className="flex flex-col items-center flex-shrink-0"
              style={{ width: `${CARD_WIDTH - 8}px` }} // -8 to account for space-x-2
            >
              <div className="rounded-2xl h-14 w-14 flex items-center justify-center bg-white border border-black/10 overflow-hidden mb-2">
                <img
                  loading="lazy"
                  src={store.logo}
                  alt={`${store.name} logo`}
                  className="h-[110%] w-full object-cover pointer-events-none select-none"
                  draggable="false"
                  style={{
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden'
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-center text-gray-700 truncate w-full">
                {store.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreCarousel;
