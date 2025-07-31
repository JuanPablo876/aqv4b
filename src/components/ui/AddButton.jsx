import React from 'react';

/**
 * Reusable Add Button component
 * Standardizes "Add New" buttons across all pages
 * 
 * @param {string} text - Button text (e.g., "Nuevo Cliente", "Nuevo Producto")
 * @param {function} onClick - Click handler function
 * @param {string} icon - Optional icon type ('plus', 'user', 'package', etc.)
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether button is disabled
 */
const AddButton = ({ 
  text, 
  onClick, 
  icon = 'plus', 
  className = '', 
  disabled = false,
  variant = 'primary' // 'primary', 'secondary', 'success'
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'user':
        return (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'package':
        return (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'clipboard':
        return (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      default: // plus
        return (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      default: // primary
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg 
        ${getVariantClasses()}
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        transition-colors duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {getIcon()}
      {text}
    </button>
  );
};

export default AddButton;
