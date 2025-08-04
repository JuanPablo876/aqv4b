import React, { useState, useRef, useEffect } from 'react';

const ZoomableContent = ({ 
  children, 
  className = "", 
  maxZoom = 1.5,
  minZoom = 0.8,
  zoomStep = 0.1,
  showZoomControls = true
}) => {
  const [zoom, setZoom] = useState(1.0);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [showNavigationBar, setShowNavigationBar] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const contentRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate if content is overflowing and needs navigation
  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current && containerRef.current) {
        const content = contentRef.current;
        const container = containerRef.current;
        
        const isOverflowing = 
          content.scrollWidth > container.clientWidth || 
          content.scrollHeight > container.clientHeight ||
          zoom > 1.1; // Show navigation bar when zoomed in
        
        setShowNavigationBar(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [zoom]);

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + zoomStep, maxZoom));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - zoomStep, minZoom));
  };

  // Reset zoom
  const handleZoomReset = () => {
    setZoom(1.0);
    if (contentRef.current) {
      contentRef.current.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    }
  };

  // Handle scroll position updates
  const handleScroll = (e) => {
    const { scrollLeft, scrollTop } = e.target;
    setScrollPosition({ x: scrollLeft, y: scrollTop });
  };

  // Navigation functions with smooth scrolling
  const scrollToPosition = (direction) => {
    if (!contentRef.current) return;
    
    setIsNavigating(true);
    const scrollAmount = 300; // Increased for better navigation
    const current = contentRef.current;
    
    switch (direction) {
      case 'left':
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        break;
      case 'right':
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        break;
      case 'up':
        current.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        break;
      case 'down':
        current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        break;
      default:
        break;
    }
    
    // Reset navigation state after animation
    setTimeout(() => setIsNavigating(false), 300);
  };

  // Get scroll indicators
  const getScrollIndicators = () => {
    if (!contentRef.current) return { 
      canScrollLeft: false, 
      canScrollRight: false, 
      canScrollUp: false, 
      canScrollDown: false 
    };
    
    const element = contentRef.current;
    return {
      canScrollLeft: element.scrollLeft > 0,
      canScrollRight: element.scrollLeft < (element.scrollWidth - element.clientWidth),
      canScrollUp: element.scrollTop > 0,
      canScrollDown: element.scrollTop < (element.scrollHeight - element.clientHeight)
    };
  };

  const scrollIndicators = getScrollIndicators();

  return (
    <div className={`relative h-full ${className}`}>
      {/* Zoom and Navigation Controls */}
      {showZoomControls && (
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Zoom:</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= minZoom}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Zoom Out (Ctrl + -)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <span className="text-sm font-mono min-w-[3.5rem] text-center text-gray-700 dark:text-gray-300 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                {(zoom * 100).toFixed(0)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                disabled={zoom >= maxZoom}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Zoom In (Ctrl + +)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              <button
                onClick={handleZoomReset}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                title="Reset Zoom (Ctrl + 0)"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Navigation Controls - Always show when zoomed */}
          {showNavigationBar && (
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Navigate:</span>
              
              {/* Horizontal Navigation */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => scrollToPosition('left')}
                  disabled={!scrollIndicators.canScrollLeft}
                  className={`p-2 rounded-md transition-all ${
                    scrollIndicators.canScrollLeft 
                      ? 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm' 
                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  } ${isNavigating ? 'scale-95' : ''}`}
                  title="Scroll Left"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => scrollToPosition('right')}
                  disabled={!scrollIndicators.canScrollRight}
                  className={`p-2 rounded-md transition-all ${
                    scrollIndicators.canScrollRight 
                      ? 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm' 
                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  } ${isNavigating ? 'scale-95' : ''}`}
                  title="Scroll Right"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Vertical Navigation */}
              <div className="flex flex-col bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => scrollToPosition('up')}
                  disabled={!scrollIndicators.canScrollUp}
                  className={`p-2 rounded-md transition-all ${
                    scrollIndicators.canScrollUp 
                      ? 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm' 
                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  } ${isNavigating ? 'scale-95' : ''}`}
                  title="Scroll Up"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => scrollToPosition('down')}
                  disabled={!scrollIndicators.canScrollDown}
                  className={`p-2 rounded-md transition-all ${
                    scrollIndicators.canScrollDown 
                      ? 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm' 
                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  } ${isNavigating ? 'scale-95' : ''}`}
                  title="Scroll Down"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Position Indicator */}
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {Math.round(scrollPosition.x)}, {Math.round(scrollPosition.y)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scrollable Content Container */}
      <div 
        ref={containerRef}
        className="relative h-full overflow-hidden"
      >
        <div
          ref={contentRef}
          className="content-container h-full overflow-auto"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
            transition: isNavigating ? 'none' : 'transform 0.2s ease-out'
          }}
          onScroll={handleScroll}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ZoomableContent;
