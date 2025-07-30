// Date and time formatting utilities with user preferences

import { loadFromStorage } from './storage';

const THEME_STORAGE_KEY = 'app_theme_preferences';

// Get user preferences
const getUserPreferences = () => {
  const defaultPreferences = {
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24h',
    language: 'es'
  };
  
  const saved = loadFromStorage(THEME_STORAGE_KEY, defaultPreferences);
  return saved;
};

// Format date based on user preference
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const prefs = getUserPreferences();
  const format = options.format || prefs.dateFormat;
  const locale = prefs.language === 'es' ? 'es-MX' : 'en-US';
  
  switch (format) {
    case 'dd/mm/yyyy':
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    
    case 'mm/dd/yyyy':
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    
    case 'yyyy-mm-dd':
      return date.toISOString().split('T')[0];
    
    case 'relative':
      return formatRelativeDate(date, locale);
    
    case 'long':
      return date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    
    case 'short':
      return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric'
      });
    
    default:
      return date.toLocaleDateString(locale);
  }
};

// Format time based on user preference
export const formatTime = (dateInput, options = {}) => {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const prefs = getUserPreferences();
  const format = options.format || prefs.timeFormat;
  const locale = prefs.language === 'es' ? 'es-MX' : 'en-US';
  
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12h'
  };
  
  if (options.showSeconds) {
    timeOptions.second = '2-digit';
  }
  
  return date.toLocaleTimeString(locale, timeOptions);
};

// Format date and time together
export const formatDateTime = (dateInput, options = {}) => {
  if (!dateInput) return '';
  
  const datePart = formatDate(dateInput, { format: options.dateFormat });
  const timePart = formatTime(dateInput, { 
    format: options.timeFormat,
    showSeconds: options.showSeconds 
  });
  
  return `${datePart} ${timePart}`;
};

// Format relative date (e.g., "hace 2 días", "2 days ago")
export const formatRelativeDate = (date, locale = 'es-MX') => {
  const now = new Date();
  const diffInMs = now - date;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (locale === 'es-MX') {
    if (diffInSeconds < 60) return 'hace unos momentos';
    if (diffInMinutes < 60) return `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
    if (diffInHours < 24) return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    if (diffInDays < 7) return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    const years = Math.floor(diffInDays / 365);
    return `hace ${years} ${years === 1 ? 'año' : 'años'}`;
  } else {
    // English format
    if (diffInSeconds < 60) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(diffInDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
};

// Format currency with user locale preference
export const formatCurrency = (amount, currency = 'MXN') => {
  const prefs = getUserPreferences();
  const locale = prefs.language === 'es' ? 'es-MX' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format number with user locale preference
export const formatNumber = (number, options = {}) => {
  const prefs = getUserPreferences();
  const locale = prefs.language === 'es' ? 'es-MX' : 'en-US';
  
  return new Intl.NumberFormat(locale, options).format(number);
};

// Get formatted date range
export const formatDateRange = (startDate, endDate, options = {}) => {
  const start = formatDate(startDate, options);
  const end = formatDate(endDate, options);
  
  const prefs = getUserPreferences();
  const separator = prefs.language === 'es' ? ' al ' : ' to ';
  
  return `${start}${separator}${end}`;
};
