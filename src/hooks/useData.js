// React Hook for Database Service Integration
// Provides easy access to CRUD operations with automatic re-rendering
import { useState, useEffect, useCallback } from 'react';
import databaseService from '../services/databaseService';
import { supabase } from '../supabaseClient';

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

  // Memoize filters and relations to prevent infinite loops
  const filtersKey = JSON.stringify(filters);
  const relationsKey = JSON.stringify(relations);

  // Load data function - use primitive dependencies to prevent infinite loops
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Loading data for entity: ${entity}`);
      
      let result;
      
      if (Object.keys(relations).length > 0) {
        result = await databaseService.getWithRelations(entity, relations);
      } else if (Object.keys(filters).length > 0 || sortBy) {
        result = await databaseService.query(entity, filters, { sortBy, sortOrder });
      } else {
        result = await databaseService.getAll(entity);
      }
      
      console.log(`✅ Loaded ${entity}:`, { count: result?.length || 0, data: result?.slice(0, 2) });
      setData(result);
    } catch (err) {
      console.error(`❌ Error loading ${entity}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [entity, filtersKey, relationsKey, sortBy, sortOrder]);

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
      const created = await databaseService.create(entity, newItem);
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
      const updated = await databaseService.update(entity, id, updates);
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
      const result = await databaseService.delete(entity, id);
      await loadData(); // Refresh data
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [entity, loadData]);

  const getById = useCallback(async (id) => {
    try {
      return await databaseService.getById(entity, id);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [entity]);

  // Bulk operations
  const bulkCreate = useCallback(async (items) => {
    try {
      setError(null);
      const result = await databaseService.bulkCreate(entity, items);
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
      const result = await databaseService.bulkDelete(entity, ids);
      await loadData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [entity, loadData]);

  // Search and filter
  const search = useCallback(async (searchFilters, searchOptions = {}) => {
    try {
      setError(null);
      const result = await databaseService.query(entity, searchFilters, searchOptions);
      return result;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [entity]);

  // Get statistics
  const getStats = useCallback(async () => {
    try {
      return await databaseService.getStats(entity);
    } catch (err) {
      setError(err.message);
      return { total: 0, recent: 0, lastUpdated: new Date().getTime() };
    }
  }, [entity]);

  // Export data
  const exportData = useCallback(async (exportFilters = {}, format = 'json') => {
    try {
      return await databaseService.exportData(entity, exportFilters, format);
    } catch (err) {
      setError(err.message);
      throw err;
    }
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

// Specialized hooks for common entities - simplified version to prevent loops
export const useClients = (options) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simple load function without complex dependencies
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await databaseService.getAll('clients');
      setData(result);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to prevent loops

  // Load data on mount only
  useEffect(() => {
    loadData();
  }, []); // Empty dependency array

  // CRUD operations
  const create = useCallback(async (newItem) => {
    try {
      setError(null);
      const created = await databaseService.create('clients', newItem);
      await loadData();
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadData]);

  const update = useCallback(async (id, updates) => {
    try {
      setError(null);
      const updated = await databaseService.update('clients', id, updates);
      await loadData();
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadData]);

  const deleteItem = useCallback(async (id) => {
    try {
      setError(null);
      const result = await databaseService.delete('clients', id);
      await loadData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadData]);

  return {
    data,
    loading,
    error,
    create,
    update,
    delete: deleteItem,
    loadData
  };
};

export const useProducts = (options) => useData('products', options);
export const useOrders = (options) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simple load function without complex dependencies
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get orders with their items
      const ordersResult = await databaseService.getAll('orders');
      console.log('🔍 useOrders: Loaded', ordersResult?.length || 0, 'orders');
      
      // For each order, fetch its items
      const ordersWithItems = await Promise.all(
        ordersResult.map(async (order) => {
          try {
            // Get order items from order_items table
            const { data: items, error: itemsError } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);
              
            if (itemsError) {
              console.error('Error fetching order items for order', order.id, ':', itemsError);
              return { ...order, items: [] };
            }
            
            console.log(`� Order ${order.order_number}: ${items?.length || 0} items`);
            return { ...order, items: items || [] };
          } catch (err) {
            console.error('Error fetching items for order', order.id, ':', err);
            return { ...order, items: [] };
          }
        })
      );
      
      console.log('✅ useOrders: All orders loaded with items');
      setData(ordersWithItems);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to prevent loops

  // Load data on mount only
  useEffect(() => {
    loadData();
  }, []); // Empty dependency array

  // CRUD operations
  const create = useCallback(async (newItem) => {
    try {
      setError(null);
      console.log('🔍 useOrders create: Saving order with items:', newItem);
      
      // Extract items from the order data
      const orderItems = newItem.items || [];
      const orderData = { ...newItem };
      delete orderData.items; // Remove items from order data as it doesn't belong in orders table
      
      // Create the order first
      const createdOrder = await databaseService.create('orders', orderData);
      console.log('✅ Order created:', createdOrder);
      
      // If there are items, save them to order_items table
      if (orderItems.length > 0) {
        console.log('📦 Saving order items:', orderItems.length, 'items');
        
        const orderItemsToSave = orderItems.map(item => ({
          order_id: createdOrder.id,
          product_id: item.productId || item.product_id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0
        }));
        
        console.log('📝 Order items to save:', orderItemsToSave);
        
        const { data: savedItems, error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsToSave)
          .select();
        
        if (itemsError) {
          console.error('❌ Error saving order items:', itemsError);
          // Don't throw error, just log it - order was already created
        } else {
          console.log('✅ Order items saved:', savedItems);
        }
      }
      
      // Reload data to get the complete order with items
      await loadData();
      return createdOrder;
    } catch (err) {
      console.error('❌ Error creating order:', err);
      setError(err.message);
      throw err;
    }
  }, [loadData]);

  const update = useCallback(async (id, updates) => {
    try {
      setError(null);
      console.log('🔍 useOrders update: Updating order with items:', id, updates);
      
      // Extract items from the updates
      const orderItems = updates.items || [];
      const orderData = { ...updates };
      delete orderData.items; // Remove items from order data as it doesn't belong in orders table
      
      // Update the order first
      const updatedOrder = await databaseService.update('orders', id, orderData);
      console.log('✅ Order updated:', updatedOrder);
      
      // Handle order items update
      if (orderItems.length > 0) {
        console.log('📦 Updating order items:', orderItems.length, 'items');
        
        // First, delete existing order items for this order
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', id);
        
        if (deleteError) {
          console.error('❌ Error deleting old order items:', deleteError);
        } else {
          console.log('🗑️ Deleted old order items');
        }
        
        // Then insert the new order items
        const orderItemsToSave = orderItems.map(item => ({
          order_id: id,
          product_id: item.productId || item.product_id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0
        }));
        
        console.log('📝 New order items to save:', orderItemsToSave);
        
        const { data: savedItems, error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsToSave)
          .select();
        
        if (itemsError) {
          console.error('❌ Error saving updated order items:', itemsError);
        } else {
          console.log('✅ Updated order items saved:', savedItems);
        }
      }
      
      // Reload data to get the complete order with items
      await loadData();
      return updatedOrder;
    } catch (err) {
      console.error('❌ Error updating order:', err);
      setError(err.message);
      throw err;
    }
  }, [loadData]);

  const deleteItem = useCallback(async (id) => {
    try {
      setError(null);
      const result = await databaseService.delete('orders', id);
      await loadData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadData]);

  return {
    data,
    loading,
    error,
    create,
    update,
    delete: deleteItem,
    loadData
  };
};
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await databaseService.getRelated(entity, id, relatedEntity, foreignKey);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [entity, id, relatedEntity, foreignKey]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [loadData, id]);

  return { data, loading, error, loadData };
};

// Hook for dashboard analytics
export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await databaseService.getDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return { dashboardData, loading, error };
};
