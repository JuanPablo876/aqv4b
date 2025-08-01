import React, { useState, useRef, useEffect } from 'react';
import VenetianTile from './VenetianTile';

const ScrollableTable = ({ 
  children, 
  className = "", 
  showScrollbar = true,
  maxZoom = 1.5,
  minZoom = 0.8,
  zoomStep = 0.1
}) => {
  const [zoom, setZoom] = useState(1.0);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [showNavigationBar, setShowNavigationBar] = useState(false);
  const tableRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate if content is overflowing and needs navigation
  useEffect(() => {
    const checkOverflow = () => {
      if (tableRef.current && containerRef.current) {
        const table = tableRef.current;
        const container = containerRef.current;
        
        const isOverflowing = 
          table.scrollWidth > container.clientWidth || 
          table.scrollHeight > container.clientHeight ||
          zoom > 1.2; // Show navigation bar when zoomed in significantly
        
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
    if (tableRef.current) {
      tableRef.current.scrollTo(0, 0);
    }
  };

  // Handle scroll position updates
  const handleScroll = (e) => {
    const { scrollLeft, scrollTop } = e.target;
    setScrollPosition({ x: scrollLeft, y: scrollTop });
  };

  // Navigation functions
  const scrollToPosition = (direction) => {
    if (!tableRef.current) return;
    
    const scrollAmount = 200;
    const current = tableRef.current;
    
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
  };

  // Get scroll indicators
  const getScrollIndicators = () => {
    if (!tableRef.current) return { canScrollLeft: false, canScrollRight: false, canScrollUp: false, canScrollDown: false };
    
    const element = tableRef.current;
    return {
      canScrollLeft: element.scrollLeft > 0,
      canScrollRight: element.scrollLeft < (element.scrollWidth - element.clientWidth),
      canScrollUp: element.scrollTop > 0,
      canScrollDown: element.scrollTop < (element.scrollHeight - element.clientHeight)
    };
  };

  const scrollIndicators = getScrollIndicators();

  return (
    <VenetianTile className={`relative overflow-hidden ${className}`}>
      {/* Zoom and Navigation Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Zoom:</span>
          <button
            onClick={handleZoomOut}
            disabled={zoom <= minZoom}
            className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="text-sm font-mono min-w-[3rem] text-center text-gray-700 dark:text-gray-300">
            {(zoom * 100).toFixed(0)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            disabled={zoom >= maxZoom}
            className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            onClick={handleZoomReset}
            className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>

        {/* Navigation Controls - Only show when needed */}
        {showNavigationBar && (
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Navigate:</span>
            
            {/* Directional Navigation */}
            <button
              onClick={() => scrollToPosition('up')}
              disabled={!scrollIndicators.canScrollUp}
              className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Scroll Up"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            
            <div className="flex space-x-1">
              <button
                onClick={() => scrollToPosition('left')}
                disabled={!scrollIndicators.canScrollLeft}
                className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Scroll Left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => scrollToPosition('right')}
                disabled={!scrollIndicators.canScrollRight}
                className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Scroll Right"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={() => scrollToPosition('down')}
              disabled={!scrollIndicators.canScrollDown}
              className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Scroll Down"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Table Container */}
      <div 
        ref={containerRef}
        className="relative h-full"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        <div
          ref={tableRef}
          className={`table-container h-full overflow-auto ${showScrollbar ? '' : 'scrollbar-hide'}`}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`
          }}
          onScroll={handleScroll}
        >
          {children}
        </div>

        {/* Scroll Position Indicator */}
        {showNavigationBar && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {Math.round(scrollPosition.x)}, {Math.round(scrollPosition.y)}
          </div>
        )}
      </div>

      {/* Custom scrollbar hide styles */}
      <style jsx>{`
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </VenetianTile>
  );
};

export default ScrollableTable;
