// Responsive Design Utility for Touch Optimization
// Enhances mobile and tablet user experience
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for responsive breakpoint detection
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setBreakpoint('mobile');
        setIsMobile(true);
        setIsTablet(false);
      } else if (width < 1024) {
        setBreakpoint('tablet');
        setIsMobile(false);
        setIsTablet(true);
      } else {
        setBreakpoint('desktop');
        setIsMobile(false);
        setIsTablet(false);
      }

      // Detect touch capability
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return { breakpoint, isMobile, isTablet, isTouch };
};

/**
 * Touch-optimized button classes
 */
export const getTouchOptimizedClasses = (size = 'md') => {
  const baseClasses = 'touch-manipulation select-none transition-all duration-150 active:scale-95';
  
  const sizeClasses = {
    sm: 'min-h-[40px] min-w-[40px] px-3 py-2 text-sm',
    md: 'min-h-[44px] min-w-[44px] px-4 py-2.5',
    lg: 'min-h-[48px] min-w-[48px] px-6 py-3 text-lg'
  };

  return `${baseClasses} ${sizeClasses[size]}`;
};

/**
 * Responsive table configuration
 */
export const getResponsiveTableConfig = (isMobile, isTablet) => {
  if (isMobile) {
    return {
      pageSize: 10,
      compact: true,
      stickyHeader: true,
      virtualScrolling: false,
      maxHeight: '400px',
      showLimitedColumns: true,
      cardView: true
    };
  }
  
  if (isTablet) {
    return {
      pageSize: 15,
      compact: false,
      stickyHeader: true,
      virtualScrolling: false,
      maxHeight: '500px',
      showLimitedColumns: false,
      cardView: false
    };
  }
  
  return {
    pageSize: 25,
    compact: false,
    stickyHeader: true,
    virtualScrolling: true,
    maxHeight: '600px',
    showLimitedColumns: false,
    cardView: false
  };
};

/**
 * Responsive modal configuration
 */
export const getResponsiveModalConfig = (isMobile, isTablet) => {
  if (isMobile) {
    return {
      fullScreen: true,
      placement: 'bottom',
      maxWidth: '100%',
      padding: 'p-4',
      closeButton: 'top-right-large'
    };
  }
  
  if (isTablet) {
    return {
      fullScreen: false,
      placement: 'center',
      maxWidth: '90%',
      padding: 'p-6',
      closeButton: 'top-right'
    };
  }
  
  return {
    fullScreen: false,
    placement: 'center',
    maxWidth: '70%',
    padding: 'p-8',
    closeButton: 'top-right'
  };
};

/**
 * Mobile-optimized form field classes
 */
export const getMobileFormClasses = (isMobile) => {
  const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary';
  
  if (isMobile) {
    return `${baseClasses} text-base min-h-[44px] px-4 py-3`; // Larger touch targets
  }
  
  return `${baseClasses} text-sm px-3 py-2`;
};

/**
 * Card view component for mobile tables
 */
export const TableCard = ({ item, columns, onEdit, onDelete, onView, className = '' }) => {
  const { isMobile } = useBreakpoint();
  
  if (!isMobile) return null;

  return (
    <div className={`bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600 p-4 mb-3 ${className}`}>
      {/* Primary info */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-dark-100 truncate">
            {item[columns[0]?.key] || 'N/A'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-dark-300 mt-1">
            {item[columns[1]?.key] || 'N/A'}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2 ml-4">
          {onView && (
            <button
              onClick={() => onView(item)}
              className={`${getTouchOptimizedClasses('sm')} text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full p-2`}
            >
              👁️
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className={`${getTouchOptimizedClasses('sm')} text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full p-2`}
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item)}
              className={`${getTouchOptimizedClasses('sm')} text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full p-2`}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      
      {/* Secondary info */}
      <div className="space-y-2">
        {columns.slice(2, 5).map((column) => (
          <div key={column.key} className="flex justify-between items-center text-sm">
            <span className="text-gray-500 dark:text-dark-300 font-medium">
              {column.header}:
            </span>
            <span className="text-gray-900 dark:text-dark-100 text-right flex-1 ml-2 truncate">
              {column.render ? column.render(item[column.key], item) : (item[column.key] || 'N/A')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Responsive container component
 */
export const ResponsiveContainer = ({ children, className = '' }) => {
  const { isMobile, isTablet } = useBreakpoint();
  
  const containerClasses = isMobile 
    ? 'px-2 py-3' 
    : isTablet 
      ? 'px-4 py-4' 
      : 'px-6 py-6';
  
  return (
    <div className={`${containerClasses} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Mobile-optimized drawer/sidebar
 */
export const MobileDrawer = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className = '' 
}) => {
  const { isMobile } = useBreakpoint();
  
  if (!isMobile) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 max-w-full bg-white dark:bg-dark-800 
          transform transition-transform duration-300 ease-in-out z-50 shadow-xl
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`${getTouchOptimizedClasses('sm')} text-gray-500 hover:text-gray-700 dark:text-dark-300 dark:hover:text-dark-100 rounded-full p-2`}
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto h-full pb-20">
          {children}
        </div>
      </div>
    </>
  );
};

/**
 * Touch-optimized swipe actions for table rows
 */
export const useSwipeActions = (onSwipeLeft, onSwipeRight) => {
  const [startX, setStartX] = useState(null);
  const [startY, setStartY] = useState(null);
  const [currentX, setCurrentX] = useState(null);
  
  const handleTouchStart = useCallback((e) => {
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    setCurrentX(e.touches[0].clientX);
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    if (!startX || !currentX) return;
    
    const diffX = startX - currentX;
    const diffY = Math.abs(startY - currentX);
    
    // Ensure horizontal swipe (not vertical scroll)
    if (Math.abs(diffX) > diffY && Math.abs(diffX) > 50) {
      if (diffX > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (diffX < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
    
    setStartX(null);
    setStartY(null);
    setCurrentX(null);
  }, [startX, startY, currentX, onSwipeLeft, onSwipeRight]);
  
  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
};

/**
 * Responsive grid utility
 */
export const getResponsiveGridClasses = (isMobile, isTablet) => {
  if (isMobile) {
    return 'grid-cols-1 gap-3';
  }
  
  if (isTablet) {
    return 'grid-cols-2 gap-4';
  }
  
  return 'grid-cols-3 lg:grid-cols-4 gap-6';
};

/**
 * Performance monitoring for mobile devices
 */
export const useMobilePerformance = () => {
  const [performanceWarnings, setPerformanceWarnings] = useState([]);
  const { isMobile } = useBreakpoint();
  
  useEffect(() => {
    if (!isMobile) return;
    
    const warnings = [];
    
    // Check viewport size
    if (window.innerWidth < 375) {
      warnings.push('Small screen detected - consider horizontal layout');
    }
    
    // Check connection speed
    if (navigator.connection?.effectiveType === 'slow-2g' || navigator.connection?.effectiveType === '2g') {
      warnings.push('Slow connection detected - enabling performance mode');
    }
    
    // Check device memory (if available)
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      warnings.push('Limited device memory - reducing complexity');
    }
    
    setPerformanceWarnings(warnings);
  }, [isMobile]);
  
  return { performanceWarnings, isMobile };
};

/**
 * Accessibility improvements for touch interfaces
 */
export const getTouchAccessibilityProps = (label, role = 'button') => {
  return {
    role,
    'aria-label': label,
    tabIndex: 0,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.target.click();
      }
    }
  };
};

export default {
  useBreakpoint,
  getTouchOptimizedClasses,
  getResponsiveTableConfig,
  getResponsiveModalConfig,
  getMobileFormClasses,
  TableCard,
  ResponsiveContainer,
  MobileDrawer,
  useSwipeActions,
  getResponsiveGridClasses,
  useMobilePerformance,
  getTouchAccessibilityProps
};
