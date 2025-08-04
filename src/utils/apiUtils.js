// Centralized API utilities for consistent data operations
import { supabase } from '../supabaseClient';
import { handleDatabaseError, handleNetworkError } from './errorHandling';

/**
 * Generic CRUD operations for database entities
 */
export class EntityAPI {
  constructor(tableName, entityName) {
    this.tableName = tableName;
    this.entityName = entityName;
  }

  /**
   * Get all records from the table
   * @param {Object} options - Query options (select, filter, order)
   * @returns {Promise<Array>} - Array of records
   */
  async getAll(options = {}) {
    try {
      let query = supabase.from(this.tableName);
      
      if (options.select) {
        query = query.select(options.select);
      } else {
        query = query.select('*');
      }
      
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleDatabaseError(error, 'read', this.entityName);
      throw error;
    }
  }

  /**
   * Get a single record by ID
   * @param {string|number} id - Record ID
   * @returns {Promise<Object>} - Single record
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'read', this.entityName);
      throw error;
    }
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>} - Created record
   */
  async create(data) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      handleDatabaseError(error, 'create', this.entityName);
      throw error;
    }
  }

  /**
   * Update an existing record
   * @param {string|number} id - Record ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} - Updated record
   */
  async update(id, data) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      handleDatabaseError(error, 'update', this.entityName);
      throw error;
    }
  }

  /**
   * Delete a record
   * @param {string|number} id - Record ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleDatabaseError(error, 'delete', this.entityName);
      throw error;
    }
  }

  /**
   * Count records matching criteria
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} - Record count
   */
  async count(filter = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });
      
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { count, error } = await query;
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      handleDatabaseError(error, 'count', this.entityName);
      throw error;
    }
  }
}

// Pre-configured API instances for each entity
export const clientsAPI = new EntityAPI('clients', 'cliente');
export const productsAPI = new EntityAPI('products', 'producto');
export const employeesAPI = new EntityAPI('employees', 'empleado');
export const ordersAPI = new EntityAPI('orders', 'pedido');
export const maintenancesAPI = new EntityAPI('maintenances', 'mantenimiento');
export const quotesAPI = new EntityAPI('quotes', 'cotización');
export const suppliersAPI = new EntityAPI('suppliers', 'proveedor');
export const transactionsAPI = new EntityAPI('transactions', 'transacción');

/**
 * Order-specific operations
 */
export const orderOperations = {
  /**
   * Get orders with items and client details
   */
  async getOrdersWithDetails() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          clients(name, email, phone),
          order_items(
            id,
            quantity,
            unit_price,
            total,
            products(name, category)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleDatabaseError(error, 'read', 'pedidos con detalles');
      throw error;
    }
  },

  /**
   * Update order status
   */
  async updateStatus(orderId, status) {
    return ordersAPI.update(orderId, { status });
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(orderId, paymentStatus) {
    return ordersAPI.update(orderId, { payment_status: paymentStatus });
  }
};

/**
 * Maintenance-specific operations
 */
export const maintenanceOperations = {
  /**
   * Get maintenances with client and employee details
   */
  async getMaintenancesWithDetails() {
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .select(`
          *,
          clients(name, email, phone, address),
          employees(name, role)
        `)
        .order('next_service_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleDatabaseError(error, 'read', 'mantenimientos con detalles');
      throw error;
    }
  },

  /**
   * Get upcoming maintenances
   */
  async getUpcomingMaintenances(days = 7) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const { data, error } = await supabase
        .from('maintenances')
        .select(`
          *,
          clients(name, email, phone)
        `)
        .gte('next_service_date', new Date().toISOString().split('T')[0])
        .lte('next_service_date', futureDate.toISOString().split('T')[0])
        .eq('status', 'active')
        .order('next_service_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleDatabaseError(error, 'read', 'mantenimientos próximos');
      throw error;
    }
  }
};

/**
 * Quote-specific operations
 */
export const quoteOperations = {
  /**
   * Get quotes with client and items details
   */
  async getQuotesWithDetails() {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          clients(name, email, phone),
          quote_items(
            id,
            quantity,
            unit_price,
            total,
            products(name, category)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleDatabaseError(error, 'read', 'cotizaciones con detalles');
      throw error;
    }
  },

  /**
   * Convert quote to order
   */
  async convertToOrder(quoteId) {
    try {
      // Get quote with items
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items(*)
        `)
        .eq('id', quoteId)
        .single();
      
      if (quoteError) throw quoteError;
      
      // Create order
      const orderData = {
        client_id: quote.client_id,
        status: 'pending',
        payment_status: 'pending',
        total: quote.total,
        delivery_date: quote.delivery_date,
        delivery_address: quote.delivery_address,
        notes: quote.notes
      };
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = quote.quote_items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Update quote status
      await quotesAPI.update(quoteId, { status: 'accepted' });
      
      return order;
    } catch (error) {
      handleDatabaseError(error, 'create', 'pedido desde cotización');
      throw error;
    }
  }
};

/**
 * Dashboard analytics operations
 */
export const analyticsOperations = {
  /**
   * Get sales summary for dashboard
   */
  async getSalesSummary(dateRange = null) {
    try {
      let query = supabase
        .from('orders')
        .select('total, created_at, status, payment_status');
      
      if (dateRange?.start && dateRange?.end) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const summary = {
        totalSales: data.reduce((sum, order) => sum + (order.total || 0), 0),
        orderCount: data.length,
        completedOrders: data.filter(o => o.status === 'completed').length,
        pendingPayments: data.filter(o => o.payment_status === 'pending').length
      };
      
      return summary;
    } catch (error) {
      handleDatabaseError(error, 'read', 'resumen de ventas');
      throw error;
    }
  },

  /**
   * Get top selling products
   */
  async getTopProducts(limit = 5, dateRange = null) {
    try {
      let query = supabase
        .from('order_items')
        .select(`
          quantity,
          total,
          products(id, name, category),
          orders(created_at)
        `);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter by date range if provided
      let filteredData = data;
      if (dateRange?.start && dateRange?.end) {
        filteredData = data.filter(item => {
          const orderDate = new Date(item.orders.created_at);
          return orderDate >= new Date(dateRange.start) && orderDate <= new Date(dateRange.end);
        });
      }
      
      // Group by product
      const productStats = {};
      filteredData.forEach(item => {
        const productId = item.products.id;
        if (!productStats[productId]) {
          productStats[productId] = {
            id: productId,
            name: item.products.name,
            category: item.products.category,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        productStats[productId].totalQuantity += item.quantity;
        productStats[productId].totalRevenue += item.total;
      });
      
      // Sort by revenue and return top products
      return Object.values(productStats)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);
    } catch (error) {
      handleDatabaseError(error, 'read', 'productos más vendidos');
      throw error;
    }
  },

  /**
   * Get top clients by orders
   */
  async getTopClients(limit = 5, dateRange = null) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          total,
          created_at,
          clients(id, name, email)
        `);
      
      if (dateRange?.start && dateRange?.end) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Group by client
      const clientStats = {};
      data.forEach(order => {
        const clientId = order.clients.id;
        if (!clientStats[clientId]) {
          clientStats[clientId] = {
            id: clientId,
            name: order.clients.name,
            email: order.clients.email,
            orderCount: 0,
            totalValue: 0
          };
        }
        clientStats[clientId].orderCount += 1;
        clientStats[clientId].totalValue += order.total;
      });
      
      // Sort by total value and return top clients
      return Object.values(clientStats)
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, limit);
    } catch (error) {
      handleDatabaseError(error, 'read', 'mejores clientes');
      throw error;
    }
  }
};
