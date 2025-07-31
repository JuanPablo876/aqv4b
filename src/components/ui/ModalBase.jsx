import React from 'react';
import VenetianTile from '../VenetianTile';

/**
 * Reusable Modal Base component
 * Standardizes modal structure and eliminates duplicate modal code
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Close handler function
 * @param {string} title - Modal title
 * @param {ReactNode} children - Modal content
 * @param {string} size - Modal size ('sm', 'md', 'lg', 'xl', '2xl')
 * @param {boolean} showCloseButton - Whether to show X button
 * @param {ReactNode} footer - Optional modal footer content
 */
const ModalBase = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'lg',
  showCloseButton = true,
  footer = null
}) => {
  if (!isOpen) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'max-w-md';
      case 'md': return 'max-w-xl';
      case 'lg': return 'max-w-2xl';
      case 'xl': return 'max-w-4xl';
      case '2xl': return 'max-w-6xl';
      default: return 'max-w-2xl';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <VenetianTile className={`w-full ${getSizeClasses()} max-h-[90vh] overflow-y-auto`}>
        {/* Modal Header */}
        <div className="p-6 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-blue-800">{title}</h3>
            {showCloseButton && (
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                aria-label="Cerrar modal"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Modal Body */}
        <div className="p-6">
          {children}
        </div>
        
        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </VenetianTile>
    </div>
  );
};

export default ModalBase;
