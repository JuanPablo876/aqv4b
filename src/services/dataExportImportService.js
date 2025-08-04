// Data Export/Import Service
import { supabase } from '../supabaseClient';

export const dataExportImportService = {
  // Export all business data
  async exportAllData() {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {}
      };

      // Export clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*');
      if (clientsError) throw clientsError;
      exportData.data.clients = clients || [];

      // Export products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');
      if (productsError) throw productsError;
      exportData.data.products = products || [];

      // Export orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');
      if (ordersError) throw ordersError;
      exportData.data.orders = orders || [];

      // Export order_items
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*');
      if (orderItemsError) throw orderItemsError;
      exportData.data.order_items = orderItems || [];

      // Export quotes
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('*');
      if (quotesError) throw quotesError;
      exportData.data.quotes = quotes || [];

      // Export inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*');
      if (inventoryError) throw inventoryError;
      exportData.data.inventory = inventory || [];

      // Export maintenances
      const { data: maintenances, error: maintenancesError } = await supabase
        .from('maintenances')
        .select('*');
      if (maintenancesError) throw maintenancesError;
      exportData.data.maintenances = maintenances || [];

      // Export suppliers
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*');
      if (suppliersError) throw suppliersError;
      exportData.data.suppliers = suppliers || [];

      // Export employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*');
      if (employeesError) throw employeesError;
      exportData.data.employees = employees || [];

      // Export reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*');
      if (reviewsError) throw reviewsError;
      exportData.data.reviews = reviews || [];

      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  // Download data as JSON file
  downloadAsJSON(data, filename = 'aqualiquim_backup') {
    const timestamp = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Download data as CSV files (zipped)
  async downloadAsCSV(data, filename = 'aqualiquim_backup') {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Convert each table to CSV
      Object.keys(data.data).forEach(tableName => {
        const tableData = data.data[tableName];
        if (tableData && tableData.length > 0) {
          const csv = this.convertToCSV(tableData);
          zip.file(`${tableName}.csv`, csv);
        }
      });

      // Add metadata file
      const metadata = {
        exportDate: data.exportDate,
        version: data.version,
        tables: Object.keys(data.data),
        recordCounts: Object.keys(data.data).reduce((acc, table) => {
          acc[table] = data.data[table]?.length || 0;
          return acc;
        }, {})
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      // Generate zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().split('T')[0];
      
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating CSV export:', error);
      throw error;
    }
  },

  // Convert array of objects to CSV
  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        let value = row[header];
        
        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = '';
        }
        
        // Handle arrays and objects
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }
        
        return value;
      }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
  },

  // Import data from JSON file
  async importFromJSON(file) {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate import data structure
      if (!importData.data || !importData.version) {
        throw new Error('Formato de archivo inválido');
      }

      // Import confirmation
      const tableNames = Object.keys(importData.data);
      const totalRecords = Object.values(importData.data)
        .reduce((sum, table) => sum + (table?.length || 0), 0);
      
      const confirmMessage = `¿Confirmas la importación de ${totalRecords} registros en ${tableNames.length} tablas?\n\nTablas: ${tableNames.join(', ')}\n\n⚠️ ADVERTENCIA: Esto sobrescribirá datos existentes.`;
      
      if (!window.confirm(confirmMessage)) {
        return { success: false, message: 'Importación cancelada por el usuario' };
      }

      const results = [];

      // Import each table
      for (const tableName of tableNames) {
        const tableData = importData.data[tableName];
        if (tableData && tableData.length > 0) {
          try {
            // Clear existing data (optional - can be made configurable)
            const shouldClearFirst = window.confirm(`¿Deseas limpiar la tabla ${tableName} antes de importar?`);
            
            if (shouldClearFirst) {
              const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible ID
              
              if (deleteError) {
                console.warn(`Warning deleting from ${tableName}:`, deleteError);
              }
            }

            // Insert new data
            const { data, error } = await supabase
              .from(tableName)
              .insert(tableData);
            
            if (error) {
              results.push({ table: tableName, success: false, error: error.message, records: 0 });
            } else {
              results.push({ table: tableName, success: true, error: null, records: tableData.length });
            }
          } catch (tableError) {
            results.push({ table: tableName, success: false, error: tableError.message, records: 0 });
          }
        }
      }

      return { 
        success: true, 
        message: 'Importación completada', 
        results,
        totalTables: tableNames.length,
        successfulTables: results.filter(r => r.success).length
      };
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, message: error.message };
    }
  },

  // Get export statistics
  async getExportStatistics() {
    try {
      const stats = {};
      
      const tables = ['clients', 'products', 'orders', 'quotes', 'inventory', 'maintenances', 'suppliers', 'employees', 'reviews'];
      
      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          stats[table] = count || 0;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting export statistics:', error);
      return {};
    }
  }
};
