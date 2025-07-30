// Utility functions for localStorage management

// Create a storage object for a specific entity
const createStorage = (entityName) => {
  return {
    getAll: () => {
      const data = localStorage.getItem(entityName);
      return data ? JSON.parse(data) : [];
    },
    
    getById: (id) => {
      const data = localStorage.getItem(entityName);
      if (!data) return null;
      
      const items = JSON.parse(data);
      return items.find(item => item.id === id) || null;
    },
    
    save: (items) => {
      localStorage.setItem(entityName, JSON.stringify(items));
    },
    
    add: (item) => {
      const data = localStorage.getItem(entityName);
      const items = data ? JSON.parse(data) : [];
      
      // Generate new ID if not provided
      if (!item.id) {
        const maxId = items.length > 0 ? Math.max(...items.map(i => i.id)) : 0;
        item.id = maxId + 1;
      }
      
      items.push(item);
      localStorage.setItem(entityName, JSON.stringify(items));
      return item;
    },
    
    update: (item) => {
      const data = localStorage.getItem(entityName);
      if (!data) return false;
      
      let items = JSON.parse(data);
      const index = items.findIndex(i => i.id === item.id);
      
      if (index === -1) return false;
      
      items[index] = { ...items[index], ...item };
      localStorage.setItem(entityName, JSON.stringify(items));
      return true;
    },
    
    delete: (id) => {
      const data = localStorage.getItem(entityName);
      if (!data) return false;
      
      let items = JSON.parse(data);
      const filteredItems = items.filter(item => item.id !== id);
      
      if (filteredItems.length === items.length) return false;
      
      localStorage.setItem(entityName, JSON.stringify(filteredItems));
      return true;
    },
    
    // Initialize storage with data if empty
    initialize: (initialData) => {
      const data = localStorage.getItem(entityName);
      if (!data) {
        localStorage.setItem(entityName, JSON.stringify(initialData));
        return true;
      }
      return false;
    }
  };
};

// Helper to check if localStorage is available
const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

// Load data from localStorage
const loadFromStorage = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading from storage (${key}):`, error);
    return defaultValue;
  }
};

// Save data to localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error);
    return false;
  }
};

// Format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-MX', options);
};

export { createStorage, isStorageAvailable, formatCurrency, formatDate, loadFromStorage, saveToStorage };