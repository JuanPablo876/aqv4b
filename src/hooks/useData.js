// React Hook for Data Service Integration
// Provides easy access to CRUD operations with automatic re-rendering
import { useState, useEffect, useCallback } from 'react';
import dataService from '../services/dataService';

export const useData = (entity, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { 
    autoLoad = true, 
    filters = {}, 
    relations = {},
    sortBy,
    sortOrder = 'asc'
  } = options;

  // Load data function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      
      if (Object.keys(relations).length > 0) {
        result = dataService.getWithRelations(entity, relations);
      } else if (Object.keys(filters).length > 0 || sortBy) {
        result = dataService.query(entity, filters, { sortBy, sortOrder });
      } else {
        result = dataService.getAll(entity);
      }
      
      setData(result);
    } catch (err) {
      console.error(`Error loading ${entity}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [entity, filters, relations, sortBy, sortOrder]);

  // Auto-load data on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  // CRUD Operations with automatic data refresh
  const create = useCallback(async (newItem) => {
    try {
      setError(null);
      const created = dataService.create(entity, newItem);
      await loadData(); // Refresh data
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [entity, loadData]);

  const update = useCallback(async (id, updates) => {
    try {
      setError(null);
      const updated = dataService.update(entity, id, updates);
      await loadData(); // Refresh data
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [entity, loadData]);

  const deleteItem = useCallback(async (id) => {
    try {
      setError(null);
      const result = dataService.delete(entity, id);
      await loadData(); // Refresh data
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [entity, loadData]);

  const getById = useCallback((id) => {
    return dataService.getById(entity, id);
  }, [entity]);

  // Bulk operations
  const bulkCreate = useCallback(async (items) => {
    try {
      setError(null);
      const result = dataService.bulkCreate(entity, items);
      await loadData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [entity, loadData]);

  const bulkDelete = useCallback(async (ids) => {
    try {
      setError(null);
      const result = dataService.bulkDelete(entity, ids);
      await loadData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [entity, loadData]);

  // Search and filter
  const search = useCallback((searchFilters, searchOptions = {}) => {
    try {
      setError(null);
      const result = dataService.query(entity, searchFilters, searchOptions);
      return result;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [entity]);

  // Get statistics
  const getStats = useCallback(() => {
    return dataService.getStats(entity);
  }, [entity]);

  // Export data
  const exportData = useCallback((exportFilters = {}, format = 'json') => {
    return dataService.exportData(entity, exportFilters, format);
  }, [entity]);

  return {
    // Data state
    data,
    loading,
    error,
    
    // Actions
    loadData,
    create,
    update,
    delete: deleteItem,
    getById,
    
    // Bulk operations
    bulkCreate,
    bulkDelete,
    
    // Utilities
    search,
    getStats,
    exportData,
    
    // Computed values
    count: data.length,
    isEmpty: data.length === 0
  };
};

// Specialized hooks for common entities
export const useClients = (options) => useData('clients', options);
export const useProducts = (options) => useData('products', options);
export const useOrders = (options) => useData('orders', options);
export const useInvoices = (options) => useData('invoices', options);
export const useSuppliers = (options) => useData('suppliers', options);
export const useEmployees = (options) => useData('employees', options);
export const useQuotes = (options) => useData('quotes', options);
export const useInventory = (options) => useData('inventory', options);
export const useMaintenances = (options) => useData('maintenances', options);

// Hook for related data (e.g., orders for a specific client)
export const useRelatedData = (entity, id, relatedEntity, foreignKey) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);
      const result = dataService.getRelated(entity, id, relatedEntity, foreignKey);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [entity, id, relatedEntity, foreignKey]);

  return { data, loading, error };
};

// Hook for dashboard analytics
export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get basic stats for all entities
        const stats = {
          clients: dataService.getStats('clients'),
          products: dataService.getStats('products'),
          orders: dataService.getStats('orders'),
          invoices: dataService.getStats('invoices')
        };

        // Get recent activity
        const recentOrders = dataService.query('orders', {}, { 
          sortBy: 'createdAt', 
          sortOrder: 'desc', 
          limit: 5 
        });

        const recentClients = dataService.query('clients', {}, { 
          sortBy: 'createdAt', 
          sortOrder: 'desc', 
          limit: 5 
        });

        // Calculate revenue (mock calculation)
        const allInvoices = dataService.getAll('invoices');
        const totalRevenue = allInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);

        setDashboardData({
          stats,
          recentActivity: {
            orders: recentOrders,
            clients: recentClients
          },
          revenue: {
            total: totalRevenue,
            monthly: totalRevenue * 0.15, // Mock monthly revenue
            growth: 12.5 // Mock growth percentage
          }
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return { dashboardData, loading };
};
