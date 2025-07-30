import React from 'react';

const VenetianBackground = ({ children }) => {
  const backgroundImage = "https://4tsix0yujj.ufs.sh/f/2vMRHqOYUHc0c2ZYzyxLlIki8fCRNnvUyWdBhcZQKOVp6M0G";

  return (
    <div className="venetian-background" style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#e6f7ff', // Fallback color
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
    }}>
      {/* Overlay for transparency */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(230, 247, 255, 0.8)', // Adjust opacity here (0.8 for 80% opacity)
        zIndex: 0,
      }}></div>
      
      {/* Original Venetian tile pattern overlay (optional, adjust opacity) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 
          'linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(rgba(0, 120, 215, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 120, 215, 0.05) 1px, transparent 1px)',
        backgroundSize: 
          '50px 50px, 50px 50px, 10px 10px, 10px 10px',
        backgroundPosition: 
          '-1px -1px, -1px -1px, -1px -1px, -1px -1px',
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 0.3 // Reduced opacity to make it less intrusive
      }}></div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
};

export default VenetianBackground;
// DONE
