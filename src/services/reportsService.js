import { supabase } from '../supabaseClient';

class ReportsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Cache management
  getCacheKey(method, params) {
    return `${method}_${JSON.stringify(params)}`;
  }

  isCacheValid(timestamp) {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get sales report data
  async getSalesReport(period = 'month') {
    const cacheKey = this.getCacheKey('getSalesReport', { period });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { startDate, endDate, groupBy } = this.getDateRange(period);

      // Get orders/invoices for sales data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
        // Removed status filter to show all orders

      if (ordersError) throw ordersError;

      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (invoicesError) throw invoicesError;

      // Combine orders and invoices for comprehensive sales data
      const allSales = [
        ...orders.map(order => ({
          ...order,
          type: 'order',
          amount: order.total || 0
        })),
        ...invoices.map(invoice => ({
          ...invoice,
          type: 'invoice', 
          amount: invoice.total || 0
        }))
      ];

      // Group by time period
      const salesByPeriod = this.groupSalesByPeriod(allSales, groupBy);
      
      // Calculate totals
      const totalSales = allSales.reduce((sum, sale) => sum + sale.amount, 0);
      const totalOrders = orders.length;
      const totalInvoices = invoices.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / (totalOrders + totalInvoices) : 0;

      const result = {
        salesByPeriod,
        totalSales,
        totalOrders,
        totalInvoices,
        averageOrderValue,
        period,
        dateRange: { startDate, endDate }
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error getting sales report:', error);
      throw error;
    }
  }

  // Get inventory report
  async getInventoryReport() {
    const cacheKey = this.getCacheKey('getInventoryReport', {});
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Get inventory with product details
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          *,
          products (
            name,
            category,
            price,
            cost
          )
        `);

      if (inventoryError) throw inventoryError;

      // Calculate inventory metrics
      const totalItems = inventory.length;
      const totalValue = inventory.reduce((sum, item) => 
        sum + (item.quantity * (item.products?.price || 0)), 0
      );
      const lowStockItems = inventory.filter(item => 
        item.quantity <= item.min_stock
      );
      const outOfStockItems = inventory.filter(item => 
        item.quantity === 0
      );

      // Group by category
      const categoryStats = {};
      inventory.forEach(item => {
        const category = item.products?.category || 'Sin Categoría';
        if (!categoryStats[category]) {
          categoryStats[category] = {
            category,
            items: 0,
            totalValue: 0,
            lowStock: 0,
            outOfStock: 0
          };
        }
        categoryStats[category].items++;
        categoryStats[category].totalValue += item.quantity * (item.products?.price || 0);
        if (item.quantity <= item.min_stock) categoryStats[category].lowStock++;
        if (item.quantity === 0) categoryStats[category].outOfStock++;
      });

      const result = {
        totalItems,
        totalValue,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        lowStockItems: lowStockItems.slice(0, 10), // Top 10 low stock
        categoryStats: Object.values(categoryStats),
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error getting inventory report:', error);
      throw error;
    }
  }

  // Get top products report
  async getTopProductsReport(period = 'month', limit = 10) {
    const cacheKey = this.getCacheKey('getTopProductsReport', { period, limit });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { startDate, endDate } = this.getDateRange(period);

      // Get order items with product details
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner (
            created_at,
            status
          ),
          products (
            name,
            category,
            price
          )
        `)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString())
        .eq('orders.status', 'completed');

      if (orderError) throw orderError;

      // Aggregate by product
      const productStats = {};
      orderItems.forEach(item => {
        const productId = item.product_id;
        if (!productStats[productId]) {
          productStats[productId] = {
            product_id: productId,
            name: item.products?.name || 'Producto Desconocido',
            category: item.products?.category || 'Sin Categoría',
            price: item.products?.price || 0,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0
          };
        }
        productStats[productId].totalQuantity += item.quantity;
        productStats[productId].totalRevenue += item.quantity * item.price;
        productStats[productId].orderCount++;
      });

      // Sort by revenue and limit
      const topProducts = Object.values(productStats)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);

      const result = {
        topProducts,
        period,
        totalProducts: Object.keys(productStats).length,
        dateRange: { startDate, endDate }
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error getting top products report:', error);
      throw error;
    }
  }

  // Get client performance report
  async getClientPerformanceReport(period = 'month', limit = 10) {
    const cacheKey = this.getCacheKey('getClientPerformanceReport', { period, limit });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { startDate, endDate } = this.getDateRange(period);

      // Get orders with client details
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          clients (
            name,
            contact,
            email,
            phone,
            type,
            customer_type
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ordersError) throw ordersError;

      // Aggregate by client
      const clientStats = {};
      orders.forEach(order => {
        const clientId = order.client_id;
        if (!clientStats[clientId]) {
          clientStats[clientId] = {
            client_id: clientId,
            name: order.clients?.name || 'Cliente Desconocido',
            contact: order.clients?.contact || '',
            email: order.clients?.email || '',
            phone: order.clients?.phone || '',
            type: order.clients?.type || '',
            customer_type: order.clients?.customer_type || 'regular',
            totalOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0,
            lastOrderDate: null
          };
        }
        clientStats[clientId].totalOrders++;
        clientStats[clientId].totalSpent += order.total || 0;
        
        const orderDate = new Date(order.created_at);
        if (!clientStats[clientId].lastOrderDate || orderDate > new Date(clientStats[clientId].lastOrderDate)) {
          clientStats[clientId].lastOrderDate = order.created_at;
        }
      });

      // Calculate average order value
      Object.values(clientStats).forEach(client => {
        client.averageOrderValue = client.totalOrders > 0 ? client.totalSpent / client.totalOrders : 0;
      });

      // Sort by total spent and limit
      const topClients = Object.values(clientStats)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);

      const result = {
        topClients,
        period,
        totalClients: Object.keys(clientStats).length,
        dateRange: { startDate, endDate }
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error getting client performance report:', error);
      throw error;
    }
  }

  // Get comprehensive reports summary
  async getReportsSummary(period = 'month') {
    const cacheKey = this.getCacheKey('getReportsSummary', { period });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const [salesReport, inventoryReport, topProducts, topClients] = await Promise.all([
        this.getSalesReport(period),
        this.getInventoryReport(),
        this.getTopProductsReport(period, 5),
        this.getClientPerformanceReport(period, 5)
      ]);

      const result = {
        sales: salesReport,
        inventory: inventoryReport,
        topProducts: topProducts.topProducts,
        topClients: topClients.topClients,
        period,
        generatedAt: new Date().toISOString()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error getting reports summary:', error);
      throw error;
    }
  }

  // Get sales by category report
  async getSalesByCategory(period = 'month') {
    const cacheKey = this.getCacheKey('getSalesByCategory', { period });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { startDate, endDate } = this.getDateRange(period);

      // Get order items with product details for category breakdown
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner (
            created_at,
            status,
            date
          ),
          products (
            name,
            category,
            price
          )
        `)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString());

      if (orderError) throw orderError;

      // Group by category
      const categoryStats = {};
      orderItems.forEach(item => {
        const category = item.products?.category || 'Sin Categoría';
        if (!categoryStats[category]) {
          categoryStats[category] = {
            category,
            totalRevenue: 0,
            totalQuantity: 0,
            orderCount: 0,
            avgPrice: 0
          };
        }
        categoryStats[category].totalRevenue += item.quantity * item.price;
        categoryStats[category].totalQuantity += item.quantity;
        categoryStats[category].orderCount++;
      });

      // Calculate averages
      Object.values(categoryStats).forEach(cat => {
        cat.avgPrice = cat.totalQuantity > 0 ? cat.totalRevenue / cat.totalQuantity : 0;
      });

      // Sort by revenue
      const salesByCategory = Object.values(categoryStats)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      const result = {
        salesByCategory,
        period,
        totalCategories: salesByCategory.length,
        totalRevenue: salesByCategory.reduce((sum, cat) => sum + cat.totalRevenue, 0),
        dateRange: { startDate, endDate }
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error getting sales by category report:', error);
      throw error;
    }
  }

  // Helper method to get date ranges
  getDateRange(period) {
    const now = new Date();
    let startDate, endDate = now;
    let groupBy = 'day';

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        groupBy = 'hour';
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = 'day';
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        groupBy = 'week';
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = 'month';
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = 'day';
    }

    return { startDate, endDate, groupBy };
  }

  // Helper method to group sales by period
  groupSalesByPeriod(sales, groupBy) {
    const groups = {};

    sales.forEach(sale => {
      const date = new Date(sale.created_at);
      let key;

      switch (groupBy) {
        case 'hour':
          key = `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:00`;
          break;
        case 'day':
          key = `${date.getDate()}/${date.getMonth() + 1}`;
          break;
        case 'week':
          const weekStart = new Date(date.getTime() - date.getDay() * 24 * 60 * 60 * 1000);
          key = `Semana ${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
          break;
        case 'month':
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          key = months[date.getMonth()];
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groups[key]) {
        groups[key] = {
          period: key,
          sales: 0,
          orders: 0,
          invoices: 0
        };
      }

      groups[key].sales += sale.amount;
      if (sale.type === 'order') groups[key].orders++;
      if (sale.type === 'invoice') groups[key].invoices++;
    });

    return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
  }
}

// Create and export singleton instance
const reportsService = new ReportsService();
export default reportsService;
