import React, { useState, useEffect, useRef } from 'react';

const DashboardDateFilter = ({ onDateRangeChange, currentRange }) => {
  const [activeFilter, setActiveFilter] = useState(currentRange || 'last7days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customRange, setCustomRange] = useState({
    startDate: '',
    endDate: ''
  });
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Predefined date range options
  const dateRangeOptions = [
    { id: 'today', label: 'Hoy', icon: '📅', description: 'Solo hoy' },
    { id: 'yesterday', label: 'Ayer', icon: '📆', description: 'Solo ayer' },
    { id: 'last7days', label: 'Últimos 7 días', icon: '📊', description: 'Última semana' },
    { id: 'last30days', label: 'Últimos 30 días', icon: '📈', description: 'Último mes' },
    { id: 'thisMonth', label: 'Este mes', icon: '🗓️', description: 'Mes actual' },
    { id: 'lastMonth', label: 'Mes pasado', icon: '📋', description: 'Mes anterior' },
    { id: 'last3months', label: 'Últimos 3 meses', icon: '📊', description: 'Último trimestre' },
    { id: 'thisYear', label: 'Este año', icon: '🗂️', description: 'Año actual' },
    { id: 'custom', label: 'Personalizado', icon: '⚙️', description: 'Seleccionar fechas' }
  ];

  // Calculate date range based on filter
  const calculateDateRange = (filterId) => {
    const now = new Date();
    let startDate, endDate;

    switch (filterId) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'yesterday':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'last7days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'last30days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'last3months':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = new Date(now);
        break;
    }

    return { startDate, endDate, filterId };
  };

  // Handle filter change
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    
    if (filterId === 'custom') {
      setIsCustom(true);
      return;
    }
    
    setIsCustom(false);
    const range = calculateDateRange(filterId);
    onDateRangeChange(range);
  };

  // Handle custom date range
  const handleCustomRangeChange = () => {
    if (customRange.startDate && customRange.endDate) {
      const startDate = new Date(customRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      onDateRangeChange({
        startDate,
        endDate,
        filterId: 'custom'
      });
    }
  };

  // Initialize with default range
  useEffect(() => {
    if (!currentRange) {
      const defaultRange = calculateDateRange('last7days');
      onDateRangeChange(defaultRange);
    }
  }, []);

  // Apply custom range when dates change
  useEffect(() => {
    if (isCustom && customRange.startDate && customRange.endDate) {
      handleCustomRangeChange();
    }
  }, [customRange, isCustom]);

  // Get current filter label and description
  const getCurrentFilter = () => {
    return dateRangeOptions.find(option => option.id === activeFilter) || dateRangeOptions[2];
  };

  const currentFilter = getCurrentFilter();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center justify-between w-full min-w-[200px] px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center">
          <span className="text-lg mr-2">{currentFilter.icon}</span>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentFilter.label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{currentFilter.description}</div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="py-1">
            {dateRangeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  handleFilterChange(option.id);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                  activeFilter === option.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-3">{option.icon}</span>
                  <div>
                    <div className={`text-sm font-medium ${
                      activeFilter === option.id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {option.label}
                    </div>
                    <div className={`text-xs ${
                      activeFilter === option.id ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {option.description}
                    </div>
                  </div>
                  {activeFilter === option.id && (
                    <div className="ml-auto">
                      <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Custom Date Range Section */}
          {isCustom && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Seleccionar rango personalizado</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de inicio</label>
                    <input
                      type="date"
                      value={customRange.startDate}
                      onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de fin</label>
                    <input
                      type="date"
                      value={customRange.endDate}
                      onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (customRange.startDate && customRange.endDate) {
                      setIsDropdownOpen(false);
                    }
                  }}
                  disabled={!customRange.startDate || !customRange.endDate}
                  className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Aplicar rango personalizado
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardDateFilter;
