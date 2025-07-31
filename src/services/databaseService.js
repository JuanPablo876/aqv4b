// Database Service - Supabase Integration
// Replaces localStorage-based DataService with database operations
import { supabase } from '../supabaseClient';
import { connectionMonitor } from '../utils/connectionMonitor';

class DatabaseService {
  constructor() {
    this.entities = {
      'clients': 'clients',
      'products': 'products', 
      'suppliers': 'suppliers',
      'employees': 'employees',
      'orders': 'orders',
      'quotes': 'quotes',
      'invoices': 'invoices',
      'inventory': 'inventory',
      'maintenances': 'maintenances',
      'bankAccounts': 'bank_accounts',
      'cashBoxes': 'cash_boxes',
      'transactions': 'transactions'
    };
    
    this.initialized = false;
  }

  // Initialize database service
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Test database connection with retry logic
      let retries = 3;
      let lastError = null;
      
      while (retries > 0) {
        try {
          const { data, error, count } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true });
          
          if (error) throw error;
          
          this.initialized = true;
          console.log('🚀 DatabaseService initialized successfully');
          console.log(`📊 Found ${count || 0} clients in database`);
          return;
        } catch (err) {
          lastError = err;
          retries--;
          if (retries > 0) {
            console.log(`⚠️ Database connection attempt failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }
      
      throw lastError;
    } catch (error) {
      console.error('❌ DatabaseService initialization failed:', error);
      throw error;
    }
  }

  // Validate entity name and get table name
  getTableName(entity) {
    const tableName = this.entities[entity];
    if (!tableName) {
      throw new Error(`Unknown entity: ${entity}. Valid entities: ${Object.keys(this.entities).join(', ')}`);
    }
    return tableName;
  }

  // ============================================================================
  // BASIC CRUD OPERATIONS
  // ============================================================================

  // GET ALL - Fetch all records from a table
  async getAll(entity) {
    const tableName = this.getTableName(entity);
    
    // Ensure service is initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${entity}:`, error);
      throw new Error(`Failed to fetch ${entity}: ${error.message}`);
    }
  }

  // GET BY ID - Fetch single record by ID
  async getById(entity, id) {
    const tableName = this.getTableName(entity);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Record not found
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${entity} by ID ${id}:`, error);
      throw new Error(`Failed to fetch ${entity}: ${error.message}`);
    }
  }

  // CREATE - Insert new record
  async create(entity, data) {
    const tableName = this.getTableName(entity);
    
    try {
      // Remove id if it's empty or let database generate UUID
      const insertData = { ...data };
      if (!insertData.id) {
        delete insertData.id;
      }
      
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`✅ Created ${entity}:`, result.id);
      return result;
    } catch (error) {
      console.error(`Error creating ${entity}:`, error);
      throw new Error(`Failed to create ${entity}: ${error.message}`);
    }
  }

  // UPDATE - Update existing record
  async update(entity, id, data) {
    const tableName = this.getTableName(entity);
    
    try {
      // Remove id from update data
      const updateData = { ...data };
      delete updateData.id;
      
      const { data: result, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`✅ Updated ${entity}:`, id);
      return result;
    } catch (error) {
      console.error(`Error updating ${entity}:`, error);
      throw new Error(`Failed to update ${entity}: ${error.message}`);
    }
  }

  // DELETE - Remove record
  async delete(entity, id) {
    const tableName = this.getTableName(entity);
    
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log(`✅ Deleted ${entity}:`, id);
      return true;
    } catch (error) {
      console.error(`Error deleting ${entity}:`, error);
      throw new Error(`Failed to delete ${entity}: ${error.message}`);
    }
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  // QUERY - Fetch records with filters, sorting, and pagination
  async query(entity, filters = {}, options = {}) {
    const tableName = this.getTableName(entity);
    
    try {
      let query = supabase.from(tableName).select('*');
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string') {
            // Use ilike for case-insensitive partial matching
            query = query.ilike(key, `%${value}%`);
          } else {
            query = query.eq(key, value);
          }
        }
      });
      
      // Apply sorting
      if (options.sortBy) {
        const ascending = options.sortOrder !== 'desc';
        query = query.order(options.sortBy, { ascending });
      } else {
        // Default sort by created_at desc
        query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error querying ${entity}:`, error);
      throw new Error(`Failed to query ${entity}: ${error.message}`);
    }
  }

  // ============================================================================
  // RELATIONSHIP OPERATIONS
  // ============================================================================

  // Get related data (e.g., orders for a client)
  async getRelated(entity, id, relatedEntity, foreignKey) {
    const relatedTableName = this.getTableName(relatedEntity);
    
    try {
      const { data, error } = await supabase
        .from(relatedTableName)
        .select('*')
        .eq(foreignKey, id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching related ${relatedEntity} for ${entity}:`, error);
      throw new Error(`Failed to fetch related data: ${error.message}`);
    }
  }

  // Get data with joined relationships
  async getWithRelations(entity, relations = {}) {
    const tableName = this.getTableName(entity);
    
    try {
      // Build select string with joins
      let selectFields = '*';
      const joins = [];
      
      Object.entries(relations).forEach(([key, config]) => {
        const { entity: relatedEntity, foreignKey, localKey = 'id' } = config;
        const relatedTable = this.getTableName(relatedEntity);
        
        if (config.type === 'one') {
          joins.push(`${key}:${relatedTable}!${foreignKey}(*)`);
        } else {
          joins.push(`${key}:${relatedTable}!${foreignKey}(*)`);
        }
      });
      
      if (joins.length > 0) {
        selectFields = `*, ${joins.join(', ')}`;
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .select(selectFields);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${entity} with relations:`, error);
      // Fallback to basic query if joins fail
      return await this.getAll(entity);
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  // BULK CREATE - Insert multiple records
  async bulkCreate(entity, dataArray) {
    const tableName = this.getTableName(entity);
    
    try {
      const insertData = dataArray.map(data => {
        const item = { ...data };
        if (!item.id) delete item.id;
        return item;
      });
      
      const { data: results, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select();
      
      if (error) throw error;
      
      console.log(`✅ Bulk created ${results.length} ${entity} records`);
      return results;
    } catch (error) {
      console.error(`Error bulk creating ${entity}:`, error);
      throw new Error(`Failed to bulk create ${entity}: ${error.message}`);
    }
  }

  // BULK DELETE - Remove multiple records
  async bulkDelete(entity, ids) {
    const tableName = this.getTableName(entity);
    
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      
      console.log(`✅ Bulk deleted ${ids.length} ${entity} records`);
      return ids.length;
    } catch (error) {
      console.error(`Error bulk deleting ${entity}:`, error);
      throw new Error(`Failed to bulk delete ${entity}: ${error.message}`);
    }
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  // Get summary statistics
  async getStats(entity) {
    const tableName = this.getTableName(entity);
    
    try {
      // Get total count
      const { data: totalData, error: countError, count: total } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      // Get recent count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentData, error: recentError, count: recent } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (recentError) throw recentError;
      
      return {
        total: total || 0,
        recent: recent || 0,
        lastUpdated: new Date().getTime()
      };
    } catch (error) {
      console.error(`Error getting stats for ${entity}:`, error);
      return { total: 0, recent: 0, lastUpdated: new Date().getTime() };
    }
  }

  // Export data for reports
  async exportData(entity, filters = {}, format = 'json') {
    try {
      const data = await this.query(entity, filters);
      
      if (format === 'csv') {
        return this.convertToCSV(data);
      }
      
      return data;
    } catch (error) {
      console.error(`Error exporting ${entity}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  // Convert data to CSV format
  convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle null/undefined values
          if (value === null || value === undefined) return '';
          // Escape commas and quotes in strings
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  // ============================================================================
  // DASHBOARD SPECIFIC METHODS
  // ============================================================================

  // Get dashboard analytics data
  async getDashboardData() {
    try {
      const [
        clientsStats,
        productsStats,
        ordersStats,
        invoicesStats,
        recentOrders,
        recentClients,
        lowStockItems
      ] = await Promise.all([
        this.getStats('clients'),
        this.getStats('products'),
        this.getStats('orders'),
        this.getStats('invoices'),
        this.query('orders', {}, { limit: 5, sortBy: 'created_at', sortOrder: 'desc' }),
        this.query('clients', {}, { limit: 5, sortBy: 'created_at', sortOrder: 'desc' }),
        this.query('inventory', { quantity: { lte: 5 } }, { limit: 10 }) // Low stock items
      ]);

      // Calculate revenue from invoices
      const allInvoices = await this.getAll('invoices');
      const totalRevenue = allInvoices.reduce((sum, invoice) => sum + (parseFloat(invoice.total) || 0), 0);
      
      return {
        stats: {
          clients: clientsStats,
          products: productsStats,
          orders: ordersStats,
          invoices: invoicesStats
        },
        recentActivity: {
          orders: recentOrders,
          clients: recentClients
        },
        inventory: {
          lowStock: lowStockItems
        },
        revenue: {
          total: totalRevenue,
          monthly: totalRevenue * 0.15, // Mock monthly calculation
          growth: 12.5 // Mock growth percentage
        }
      };
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;

// Named exports for specific operations
export const {
  getAll,
  getById,
  create,
  update,
  delete: deleteItem,
  query,
  getWithRelations,
  getStats,
  exportData,
  getDashboardData
} = databaseService;
