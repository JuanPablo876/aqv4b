import React from 'react';

/**
 * Reusable Sort Icon component
 * Eliminates the need for duplicate SVG code across all table headers
 * 
 * @param {boolean} isActive - Whether this column is currently being sorted
 * @param {string} direction - 'asc' or 'desc' for sort direction
 * @param {string} className - Additional CSS classes
 */
const SortIcon = ({ isActive, direction, className = '' }) => {
  if (!isActive) {
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`ml-1 h-4 w-4 text-gray-400 ${className}`} 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
          clipRule="evenodd" 
        />
      </svg>
    );
  }

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={`ml-1 h-4 w-4 ${direction === 'asc' ? 'transform rotate-180' : ''} ${className}`} 
      viewBox="0 0 20 20" 
      fill="currentColor"
    >
      <path 
        fillRule="evenodd" 
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
        clipRule="evenodd" 
      />
    </svg>
  );
};

export default SortIcon;
