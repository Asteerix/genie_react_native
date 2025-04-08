import { memo } from 'react';
import { EventCarousel } from "./event-carousel";
import RatingSection from "./rating-section";
import CTAButtons from "../CTAButtons";
import SplitText from "./SplitText";
import { eventTypes } from "@/constants/event-types";
import { ASSETS } from "../../constants/paths";

// Add logo animation keyframes
const styles = `
@keyframes logoAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-appear {
  animation: logoAppear 0.7s ease-out 0.1s forwards;
}`;

// Add styles to document head
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const Logo = memo(() => (
  <div className="logo-appear opacity-0">
    <img 
      src={ASSETS.SVG.GENIE_LOGO} 
      alt="Genie Logo" 
      className="h-16 pointer-events-none select-none" 
      draggable="false"
    />
  </div>
));

Logo.displayName = 'Logo';

export function Hero(): JSX.Element {
  return (
    <div className="flex gap-4 md:gap-6 py-8 lg:py-24 items-center justify-center flex-col">
      <Logo />

      <div className="flex gap-4 px-4 sm:px-14 flex-col">
        <SplitText
          text="Organise et participe à des événements&nbsp;uniques&nbsp;!"
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl max-w-2xl tracking-tighter font-normal text-slate-950"
          delay={50}
          animationFrom={{ opacity: 0, transform: 'translate3d(0,40px,0)' }}
          animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
          threshold={0.2}
          rootMargin="-50px"
        />
        
        <RatingSection />
      </div>

      <CTAButtons />

      <div className="w-full -mt-32 md:-mt-2">
        <EventCarousel events={eventTypes} autoScrollSpeed={100} />
      </div>
    </div>
  );
}
