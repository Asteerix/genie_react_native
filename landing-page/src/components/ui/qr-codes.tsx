import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ASSETS } from '../../constants/paths';
import { STORE_URLS } from '../../constants/store-urls';

const QRCodesSection: React.FC = () => {
  return (
    <div className="hidden lg:flex justify-center gap-16 mt-14">
      <div 
        onClick={() => window.open(STORE_URLS.APP_STORE, '_blank')}
        className="cursor-pointer transition-transform hover:scale-105 relative"
      >
        {/* Top-left corner */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-black rounded-tl-md"></div>
        {/* Top-right corner */}
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-black rounded-tr-md"></div>
        {/* Bottom-left corner */}
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-black rounded-bl-md"></div>
        {/* Bottom-right corner */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-black rounded-br-md"></div>
        
        <QRCodeSVG 
          value={STORE_URLS.APP_STORE}
          size={160}
          level="H"
          includeMargin={true}
          bgColor="transparent"
          fgColor="#000000"
          imageSettings={{
            src: ASSETS.IMAGES.STORE.APP_STORE,
            height: 40,
            width: 40,
            excavate: true
          }}
        />
      </div>
      <div 
        onClick={() => window.open(STORE_URLS.PLAY_STORE, '_blank')}
        className="cursor-pointer transition-transform hover:scale-105 relative"
      >
        {/* Top-left corner */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-black rounded-tl-md"></div>
        {/* Top-right corner */}
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-black rounded-tr-md"></div>
        {/* Bottom-left corner */}
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-black rounded-bl-md"></div>
        {/* Bottom-right corner */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-black rounded-br-md"></div>
        
        <QRCodeSVG 
          value={STORE_URLS.PLAY_STORE}
          size={160}
          level="H"
          includeMargin={true}
          bgColor="transparent"
          fgColor="#000000"
          imageSettings={{
            src: ASSETS.IMAGES.STORE.PLAY_STORE,
            height: 40,
            width: 40,
            excavate: true
          }}
        />
      </div>
    </div>
  );
};

export default QRCodesSection;
