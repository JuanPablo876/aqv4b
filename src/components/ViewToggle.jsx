import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ViewToggle = ({ currentView, onViewChange, className = '' }) => {
  const { defaultView } = useTheme();
  
  const activeView = currentView || defaultView;
  
  const viewOptions = [
    {
      value: 'table',
      label: 'Tabla',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-9-8V6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V10z" />
        </svg>
      )
    },
    {
      value: 'grid',
      label: 'Cuadrícula',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      value: 'list',
      label: 'Lista',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    }
  ];

  return (
    <div className={`flex rounded-lg border border-gray-300 dark:border-gray-600 ${className}`}>
      {viewOptions.map((option, index) => (
        <button
          key={option.value}
          onClick={() => onViewChange(option.value)}
          className={`
            flex items-center space-x-1 px-3 py-2 text-sm font-medium transition-colors
            ${index === 0 ? 'rounded-l-lg' : ''}
            ${index === viewOptions.length - 1 ? 'rounded-r-lg' : ''}
            ${activeView === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
          title={`Ver como ${option.label}`}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewToggle;
