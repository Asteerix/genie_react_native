import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  
  const floatingStyle = {
    animation: 'floating 3s ease-in-out infinite',
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floating {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes glowing {
        0%, 100% { filter: drop-shadow(0 0 20px rgba(255,255,255,0.3)); }
        50% { filter: drop-shadow(0 0 40px rgba(255,255,255,0.5)); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <div className="text-center px-4">
        <img 
          src="/assets/svg/genie-logo-hurt.svg" 
          alt="Genie error" 
          className="w-28 h-28 mx-auto mb-6 opacity-100"
          style={{
            ...floatingStyle,
            animation: `${floatingStyle.animation}, glowing 4s ease-in-out infinite`
          }}
        />
        <h1 className="text-4xl font-bold mb-4 text-white">Abracadabra... Raté !</h1>
        <p className="text-lg text-gray-400 mb-6">Cette page s&apos;est évaporée comme par magie...</p>
        <a href="/" className="text-gray-300 hover:text-white underline font-medium">
          Retourner à l&apos;accueil
        </a>
      </div>
    </div>
  );
};

export default NotFound;
