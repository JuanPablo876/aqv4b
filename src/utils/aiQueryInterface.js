// AI Database Query Interface
// Provides safe database querying capabilities for AI assistants
import { supabase } from '../supabaseClient';

/**
 * Safe database query executor with validation and formatting
 */
class AIQueryInterface {
  
  // Allowed tables for AI queries (whitelist for security)
  static ALLOWED_TABLES = [
    'clients', 'products', 'inventory', 'orders', 'order_items',
    'quotes', 'quote_items', 'employees', 'maintenances', 
    'suppliers', 'invoices', 'transactions', 'inventory_movements'
  ];

  // Read-only operations only for AI
  static ALLOWED_OPERATIONS = ['SELECT'];

  /**
   * Execute a safe read-only query with result formatting
   * @param {string} table - Table name to query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Formatted query results
   */
  static async executeQuery(table, options = {}) {
    try {
      // Validate table access
      if (!this.ALLOWED_TABLES.includes(table)) {
        throw new Error(`Table '${table}' is not accessible for AI queries`);
      }

      const {
        select = '*',
        filters = {},
        orderBy = null,
        limit = 100,
        offset = 0
      } = options;

      console.log(`🤖 AI Query: ${table}`, { select, filters, orderBy, limit });

      // Build the query
      let query = supabase.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([column, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle operators like { gte: 100 }, { like: '%text%' }
          Object.entries(value).forEach(([operator, operatorValue]) => {
            query = query[operator](column, operatorValue);
          });
        } else {
          // Simple equality filter
          query = query.eq(column, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        const { column, ascending = true } = orderBy;
        query = query.order(column, { ascending });
      }

      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }
      if (offset > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return {
        success: true,
        table,
        data: data || [],
        count: data?.length || 0,
        totalCount: count,
        query: { table, select, filters, orderBy, limit, offset }
      };

    } catch (error) {
      console.error('❌ AI Query Error:', error);
      return {
        success: false,
        error: error.message,
        table,
        data: [],
        count: 0
      };
    }
  }

  /**
   * Get table schema information for AI context
   * @param {string} table - Table name
   * @returns {Promise<Object>} Table schema info
   */
  static async getTableSchema(table) {
    if (!this.ALLOWED_TABLES.includes(table)) {
      throw new Error(`Table '${table}' is not accessible`);
    }

    // This is a simplified schema - in production you'd query the actual schema
    const schemas = {
      clients: {
        columns: ['id', 'name', 'email', 'phone', 'address', 'status', 'total_spent', 'created_at'],
        description: 'Customer/client information and contact details'
      },
      products: {
        columns: ['id', 'name', 'description', 'price', 'category', 'sku', 'min_stock'],
        description: 'Product catalog with pricing and categories'
      },
      inventory: {
        columns: ['id', 'product_id', 'quantity', 'location', 'last_updated'],
        description: 'Current stock levels by product and location'
      },
      orders: {
        columns: ['id', 'client_id', 'date', 'status', 'total', 'payment_status'],
        description: 'Customer orders and sales transactions'
      },
      order_items: {
        columns: ['id', 'order_id', 'product_id', 'quantity', 'price', 'discount'],
        description: 'Individual items within each order'
      },
      employees: {
        columns: ['id', 'name', 'role', 'email', 'hire_date', 'status'],
        description: 'Staff and employee information'
      },
      inventory_movements: {
        columns: ['id', 'product_id', 'movement_type', 'quantity', 'reason', 'movement_date'],
        description: 'History of inventory changes and movements'
      }
    };

    return {
      table,
      schema: schemas[table] || { columns: [], description: 'Unknown table' },
      relationships: this.getTableRelationships(table)
    };
  }

  /**
   * Get relationship information for joins
   * @param {string} table - Table name
   * @returns {Array} Related tables and join keys
   */
  static getTableRelationships(table) {
    const relationships = {
      orders: [
        { table: 'clients', foreignKey: 'client_id', localKey: 'id' },
        { table: 'order_items', foreignKey: 'order_id', localKey: 'id' }
      ],
      order_items: [
        { table: 'orders', foreignKey: 'id', localKey: 'order_id' },
        { table: 'products', foreignKey: 'id', localKey: 'product_id' }
      ],
      inventory: [
        { table: 'products', foreignKey: 'id', localKey: 'product_id' }
      ],
      inventory_movements: [
        { table: 'products', foreignKey: 'id', localKey: 'product_id' },
        { table: 'inventory', foreignKey: 'id', localKey: 'inventory_id' }
      ]
    };

    return relationships[table] || [];
  }

  /**
   * Natural language to query translator (basic implementation)
   * @param {string} nlQuery - Natural language query
   * @returns {Object} Translated query parameters
   */
  static translateNaturalLanguage(nlQuery) {
    const query = nlQuery.toLowerCase().trim();
    
    // Simple pattern matching for common queries
    const patterns = [
      {
        pattern: /sales? (from|in) (?:the )?last (\d+) days?/,
        handler: (matches) => ({
          table: 'orders',
          filters: {
            date: { gte: new Date(Date.now() - parseInt(matches[2]) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
          },
          orderBy: { column: 'date', ascending: false }
        })
      },
      {
        pattern: /(?:low stock|inventory below) (\d+)/,
        handler: (matches) => ({
          table: 'inventory',
          filters: {
            quantity: { lt: parseInt(matches[1]) }
          },
          orderBy: { column: 'quantity', ascending: true }
        })
      },
      {
        pattern: /top (\d+) (?:selling )?products?/,
        handler: (matches) => ({
          table: 'order_items',
          select: 'product_id, sum(quantity) as total_sold',
          orderBy: { column: 'total_sold', ascending: false },
          limit: parseInt(matches[1])
        })
      },
      {
        pattern: /(?:all |list )?clients?/,
        handler: () => ({
          table: 'clients',
          select: 'id, name, email, phone, status',
          orderBy: { column: 'name', ascending: true }
        })
      }
    ];

    for (const { pattern, handler } of patterns) {
      const matches = query.match(pattern);
      if (matches) {
        return handler(matches);
      }
    }

    // Default fallback
    throw new Error(`Could not translate query: "${nlQuery}". Try queries like "sales from last 7 days" or "low stock below 10"`);
  }

  /**
   * Format query results for display
   * @param {Object} results - Query results
   * @returns {Object} Formatted display data
   */
  static formatResults(results) {
    if (!results.success) {
      return {
        type: 'error',
        message: results.error,
        data: null
      };
    }

    const { data, table, count } = results;

    if (count === 0) {
      return {
        type: 'empty',
        message: `No results found in ${table}`,
        data: null
      };
    }

    return {
      type: 'table',
      title: `${table.charAt(0).toUpperCase() + table.slice(1)} (${count} records)`,
      headers: Object.keys(data[0] || {}),
      rows: data.map(row => Object.values(row)),
      data,
      count
    };
  }

  /**
   * Execute natural language query
   * @param {string} nlQuery - Natural language query
   * @returns {Promise<Object>} Formatted results
   */
  static async executeNaturalLanguageQuery(nlQuery) {
    try {
      console.log(`🤖 Processing natural language query: "${nlQuery}"`);
      
      const queryParams = this.translateNaturalLanguage(nlQuery);
      const results = await this.executeQuery(queryParams.table, queryParams);
      
      return this.formatResults(results);
      
    } catch (error) {
      console.error('❌ Natural language query error:', error);
      return {
        type: 'error',
        message: error.message,
        data: null
      };
    }
  }
}

export default AIQueryInterface;
