import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const THEME_STORAGE_KEY = 'app_theme_preferences';

const defaultPreferences = {
  theme: 'system', // 'light', 'dark', 'system'
  compactMode: false,
  reducedMotion: false,
  fontSize: 'medium', // 'small', 'medium', 'large'
  sidebarCollapsed: false,
  language: 'es', // 'es', 'en'
  // New preferences
  dateFormat: 'dd/mm/yyyy', // 'dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd', 'relative'
  timeFormat: '24h', // '12h', '24h'
  defaultView: 'table', // 'table', 'grid', 'list'
  itemsPerPage: 10, // 5, 10, 25, 50
  autoSave: true,
  showTooltips: true,
  confirmDeletes: true,
  rememberFilters: true,
  // Dashboard preferences
  dashboardLayout: 'standard', // 'standard', 'compact', 'detailed'
  showWelcomeMessage: true,
  defaultDashboardPeriod: 'month', // 'day', 'week', 'month', 'year'
};

export const ThemeProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isDark, setIsDark] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = loadFromStorage(THEME_STORAGE_KEY, defaultPreferences);
    setPreferences(savedPreferences);
  }, []);

  // Apply theme to document and determine if dark mode is active
  useEffect(() => {
    const root = document.documentElement;
    
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
      setIsDark(true);
    } else if (preferences.theme === 'light') {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      // System theme
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
        setIsDark(true);
      } else {
        root.classList.remove('dark');
        setIsDark(false);
      }
    }

    // Apply other preferences
    if (preferences.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply font size
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    switch (preferences.fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      default:
        root.classList.add('text-base');
    }

    // Save preferences to localStorage
    saveToStorage(THEME_STORAGE_KEY, preferences);
  }, [preferences]);

  // Listen for system theme changes
  useEffect(() => {
    if (preferences.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        const root = document.documentElement;
        if (e.matches) {
          root.classList.add('dark');
          setIsDark(true);
        } else {
          root.classList.remove('dark');
          setIsDark(false);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [preferences.theme]);

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(preferences.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    updatePreference('theme', themes[nextIndex]);
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    saveToStorage(THEME_STORAGE_KEY, defaultPreferences);
  };

  const value = {
    preferences,
    isDark,
    updatePreference,
    toggleTheme,
    resetPreferences,
    // Convenience getters
    theme: preferences.theme,
    compactMode: preferences.compactMode,
    reducedMotion: preferences.reducedMotion,
    fontSize: preferences.fontSize,
    sidebarCollapsed: preferences.sidebarCollapsed,
    language: preferences.language,
    // New convenience getters
    dateFormat: preferences.dateFormat,
    timeFormat: preferences.timeFormat,
    defaultView: preferences.defaultView,
    itemsPerPage: preferences.itemsPerPage,
    autoSave: preferences.autoSave,
    showTooltips: preferences.showTooltips,
    confirmDeletes: preferences.confirmDeletes,
    rememberFilters: preferences.rememberFilters,
    dashboardLayout: preferences.dashboardLayout,
    showWelcomeMessage: preferences.showWelcomeMessage,
    defaultDashboardPeriod: preferences.defaultDashboardPeriod
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
