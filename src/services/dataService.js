// Central Data Management Service
// Handles all CRUD operations with localStorage persistence
import { saveToStorage, loadFromStorage } from '../utils/storage';

class DataService {
  constructor() {
    this.entities = [
      'clients',
      'products', 
      'suppliers',
      'employees',
      'orders',
      'quotes',
      'invoices',
      'inventory',
      'maintenances'
    ];
    
    this.initialized = false;
  }

  // Initialize data service - load mock data if localStorage is empty
  async initialize() {
    if (this.initialized) return;

    for (const entity of this.entities) {
      const stored = loadFromStorage(entity);
      if (!stored || stored.length === 0) {
        // Load initial mock data
        try {
          const mockData = await import(`../mock/${entity}.js`);
          const data = mockData.default || mockData[entity] || [];
          saveToStorage(entity, data);
          console.log(`✅ Initialized ${entity} with ${data.length} records`);
        } catch (error) {
          console.warn(`⚠️ No mock data found for ${entity}:`, error.message);
          saveToStorage(entity, []);
        }
      }
    }
    
    this.initialized = true;
    console.log('🚀 DataService initialized successfully');
  }

  // Generic CRUD Operations
  
  // GET ALL
  getAll(entity) {
    this.validateEntity(entity);
    return loadFromStorage(entity) || [];
  }

  // GET BY ID
  getById(entity, id) {
    this.validateEntity(entity);
    const items = this.getAll(entity);
    return items.find(item => item.id === id);
  }

  // CREATE
  create(entity, data) {
    this.validateEntity(entity);
    const items = this.getAll(entity);
    
    // Generate ID if not provided
    const newItem = {
      ...data,
      id: data.id || this.generateId(entity),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedItems = [...items, newItem];
    saveToStorage(entity, updatedItems);
    
    console.log(`✅ Created ${entity}:`, newItem.id);
    return newItem;
  }

  // UPDATE
  update(entity, id, data) {
    this.validateEntity(entity);
    const items = this.getAll(entity);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`${entity} with id ${id} not found`);
    }
    
    const updatedItem = {
      ...items[index],
      ...data,
      id, // Prevent ID changes
      updatedAt: new Date().toISOString()
    };
    
    const updatedItems = [...items];
    updatedItems[index] = updatedItem;
    saveToStorage(entity, updatedItems);
    
    console.log(`✅ Updated ${entity}:`, id);
    return updatedItem;
  }

  // DELETE
  delete(entity, id) {
    this.validateEntity(entity);
    const items = this.getAll(entity);
    const filteredItems = items.filter(item => item.id !== id);
    
    if (items.length === filteredItems.length) {
      throw new Error(`${entity} with id ${id} not found`);
    }
    
    saveToStorage(entity, filteredItems);
    console.log(`✅ Deleted ${entity}:`, id);
    return true;
  }

  // BULK OPERATIONS
  bulkCreate(entity, dataArray) {
    this.validateEntity(entity);
    const results = dataArray.map(data => this.create(entity, data));
    console.log(`✅ Bulk created ${results.length} ${entity} records`);
    return results;
  }

  bulkUpdate(entity, updates) {
    this.validateEntity(entity);
    const results = updates.map(({ id, data }) => this.update(entity, id, data));
    console.log(`✅ Bulk updated ${results.length} ${entity} records`);
    return results;
  }

  bulkDelete(entity, ids) {
    this.validateEntity(entity);
    const items = this.getAll(entity);
    const filteredItems = items.filter(item => !ids.includes(item.id));
    saveToStorage(entity, filteredItems);
    
    const deletedCount = items.length - filteredItems.length;
    console.log(`✅ Bulk deleted ${deletedCount} ${entity} records`);
    return deletedCount;
  }

  // QUERY OPERATIONS
  query(entity, filters = {}, options = {}) {
    this.validateEntity(entity);
    let items = this.getAll(entity);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        items = items.filter(item => {
          if (typeof value === 'string') {
            return item[key]?.toString().toLowerCase().includes(value.toLowerCase());
          }
          return item[key] === value;
        });
      }
    });

    // Apply sorting
    if (options.sortBy) {
      items.sort((a, b) => {
        const aVal = a[options.sortBy];
        const bVal = b[options.sortBy];
        
        if (options.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    // Apply pagination
    if (options.limit || options.offset) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      items = items.slice(start, end);
    }

    return items;
  }

  // RELATIONSHIP OPERATIONS
  
  // Get related data (e.g., orders for a client)
  getRelated(entity, id, relatedEntity, foreignKey) {
    const relatedItems = this.getAll(relatedEntity);
    return relatedItems.filter(item => item[foreignKey] === id);
  }

  // Get data with joined relationships
  getWithRelations(entity, relations = {}) {
    const items = this.getAll(entity);
    
    return items.map(item => {
      const enrichedItem = { ...item };
      
      Object.entries(relations).forEach(([key, config]) => {
        const { entity: relatedEntity, foreignKey, localKey = 'id' } = config;
        const relatedItems = this.getAll(relatedEntity);
        
        if (config.type === 'one') {
          enrichedItem[key] = relatedItems.find(
            related => related[localKey] === item[foreignKey]
          );
        } else {
          enrichedItem[key] = relatedItems.filter(
            related => related[foreignKey] === item[localKey]
          );
        }
      });
      
      return enrichedItem;
    });
  }

  // ANALYTICS & REPORTING
  
  // Get summary statistics
  getStats(entity) {
    const items = this.getAll(entity);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentItems = items.filter(item => 
      new Date(item.createdAt || item.date) >= thirtyDaysAgo
    );
    
    return {
      total: items.length,
      recent: recentItems.length,
      lastUpdated: Math.max(...items.map(item => 
        new Date(item.updatedAt || item.createdAt || 0).getTime()
      ))
    };
  }

  // Export data for reports
  exportData(entity, filters = {}, format = 'json') {
    const data = this.query(entity, filters);
    
    if (format === 'csv') {
      return this.convertToCSV(data);
    }
    
    return data;
  }

  // UTILITY METHODS
  
  validateEntity(entity) {
    if (!this.entities.includes(entity)) {
      throw new Error(`Unknown entity: ${entity}. Valid entities: ${this.entities.join(', ')}`);
    }
  }

  generateId(entity) {
    const items = this.getAll(entity);
    const maxId = Math.max(0, ...items.map(item => parseInt(item.id) || 0));
    return (maxId + 1).toString();
  }

  convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  // DATA INTEGRITY
  
  // Clear all data (for testing/reset)
  clearAll() {
    this.entities.forEach(entity => {
      saveToStorage(entity, []);
    });
    console.log('🗑️ All data cleared');
  }

  // Backup all data
  backupData() {
    const backup = {};
    this.entities.forEach(entity => {
      backup[entity] = this.getAll(entity);
    });
    
    const backupData = {
      timestamp: new Date().toISOString(),
      data: backup
    };
    
    // Save to localStorage with timestamp
    const backupKey = `backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    
    console.log('💾 Data backup created:', backupKey);
    return backupKey;
  }

  // Restore from backup
  restoreData(backupKey) {
    const backupData = JSON.parse(localStorage.getItem(backupKey) || '{}');
    
    if (!backupData.data) {
      throw new Error('Invalid backup data');
    }
    
    Object.entries(backupData.data).forEach(([entity, data]) => {
      saveToStorage(entity, data);
    });
    
    console.log('🔄 Data restored from backup:', backupKey);
  }
}

// Create singleton instance
const dataService = new DataService();

// Auto-initialize when imported
dataService.initialize().catch(console.error);

export default dataService;

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
  exportData
} = dataService;
