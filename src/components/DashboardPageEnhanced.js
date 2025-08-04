// Enhanced DashboardPage with real-time data refresh and improved error handling
// This demonstrates the improved dashboard patterns

import React, { useState, useEffect, useMemo } from 'react';
import { useOrders, useProducts, useClients, useEmployees, useMaintenances } from '../hooks';
import { useDashboardData, dashboardDataManager, performanceMonitor } from '../utils/realTimeData';
import { analyticsOperations } from '../utils/apiUtils';
import { handleError, handleSuccess } from '../utils/errorHandling';
import { useBusinessNotifications } from '../hooks/useBusinessNotifications';
import DashboardChartCard from './DashboardChartCard';
import DashboardStatsCard from './DashboardStatsCard';
import DashboardDateFilter from './DashboardDateFilter';
import DashboardInventoryAlerts from './DashboardInventoryAlerts';
import DashboardRecentActivity from './DashboardRecentActivity';
import DashboardTopItems from './DashboardTopItems';

export default function DashboardPageEnhanced() {
  // Base data hooks
  const { data: ordersList } = useOrders();
  const { data: productsList } = useProducts();
  const { data: clientsList } = useClients();
  const { data: employeesList } = useEmployees();
  const { data: maintenancesList } = useMaintenances();

  // Real-time dashboard data
  const { 
    data: salesSummary, 
    loading: salesLoading, 
    error: salesError, 
    refresh: refreshSales 
  } = useDashboardData(
    'sales-summary',
    () => analyticsOperations.getSalesSummary(),
    { refreshInterval: 30000 }
  );

  const { 
    data: topProducts, 
    loading: topProductsLoading,
    refresh: refreshTopProducts 
  } = useDashboardData(
    'top-products',
    () => analyticsOperations.getTopProducts(5),
    { refreshInterval: 60000 }
  );

  const { 
    data: topClients, 
    loading: topClientsLoading,
    refresh: refreshTopClients 
  } = useDashboardData(
    'top-clients',
    () => analyticsOperations.getTopClients(5),
    { refreshInterval: 60000 }
  );

  // UI State
  const [dateRange, setDateRange] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [refreshMode, setRefreshMode] = useState('auto'); // 'auto', 'manual', 'paused'

  // Initialize business notifications
  useBusinessNotifications();

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.startTiming('dashboard-load');
    
    return () => {
      performanceMonitor.endTiming('dashboard-load');
    };
  }, []);

  // Date-filtered data with memoization for performance
  const filteredOrders = useMemo(() => {
    if (!ordersList || !dateRange?.start || !dateRange?.end) {
      return ordersList || [];
    }

    return ordersList.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= new Date(dateRange.start) && orderDate <= new Date(dateRange.end);
    });
  }, [ordersList, dateRange]);

  // Enhanced refresh functionality
  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      performanceMonitor.startTiming('manual-refresh');
      
      // Refresh all dashboard data
      await Promise.all([
        refreshSales(),
        refreshTopProducts(),
        refreshTopClients()
      ]);
      
      setLastRefreshTime(new Date());
      handleSuccess('Dashboard actualizado exitosamente', 'manual refresh');
    } catch (error) {
      handleError(error, 'manual refresh', 'Error al actualizar dashboard');
    } finally {
      setIsRefreshing(false);
      performanceMonitor.endTiming('manual-refresh');
    }
  };

  // Auto-refresh management
  useEffect(() => {
    if (refreshMode === 'auto') {
      dashboardDataManager.startAutoRefresh();
    } else {
      dashboardDataManager.stopAutoRefresh();
    }

    return () => {
      dashboardDataManager.stopAutoRefresh();
    };
  }, [refreshMode]);

  // Enhanced chart data calculations with caching
  const chartData = useMemo(() => {
    const workingOrders = filteredOrders.length > 0 ? filteredOrders : ordersList || [];
    
    performanceMonitor.startTiming('chart-calculations');
    
    try {
      // Sales by Month (last 6 months)
      const salesByMonth = (() => {
        const monthlyData = {};
        const months = [];
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toISOString().substring(0, 7);
          const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
          monthlyData[monthKey] = 0;
          months.push(monthName);
        }
        
        // Calculate monthly totals
        workingOrders.forEach(order => {
          const monthKey = order.created_at.substring(0, 7);
          if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey] += order.total || 0;
          }
        });
        
        const amounts = Object.values(monthlyData);
        return { labels: months, data: amounts };
      })();

      // Sales by Category
      const salesByCategory = (() => {
        const categoryTotals = {};
        
        workingOrders.forEach(order => {
          // Get order items for this order (assuming relationship exists)
          const orderItems = order.order_items || [];
          
          orderItems.forEach(item => {
            const product = productsList?.find(p => p.id === item.product_id);
            const category = product?.category || 'Sin categoría';
            
            categoryTotals[category] = (categoryTotals[category] || 0) + (item.total || 0);
          });
        });
        
        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
        
        return { labels, data };
      })();

      return { salesByMonth, salesByCategory };
    } finally {
      performanceMonitor.endTiming('chart-calculations');
    }
  }, [filteredOrders, ordersList, productsList]);

  // Top items calculation with performance optimization
  const topItemsData = useMemo(() => {
    if (topProducts) return topProducts;
    
    // Fallback calculation if real-time data not available
    performanceMonitor.startTiming('top-items-fallback');
    
    try {
      const workingOrders = filteredOrders.length > 0 ? filteredOrders : ordersList || [];
      const productStats = {};
      
      workingOrders.forEach(order => {
        const orderItems = order.order_items || [];
        orderItems.forEach(item => {
          const product = productsList?.find(p => p.id === item.product_id);
          if (product) {
            if (!productStats[product.id]) {
              productStats[product.id] = {
                name: product.name,
                category: product.category,
                totalQuantity: 0,
                totalRevenue: 0
              };
            }
            productStats[product.id].totalQuantity += item.quantity || 0;
            productStats[product.id].totalRevenue += item.total || 0;
          }
        });
      });
      
      return Object.values(productStats)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);
    } finally {
      performanceMonitor.endTiming('top-items-fallback');
    }
  }, [topProducts, filteredOrders, ordersList, productsList]);

  // Loading state
  if (salesLoading && !salesSummary) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (salesError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar dashboard</h3>
          <p className="text-red-600 mb-4">{salesError}</p>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isRefreshing ? 'Reintentando...' : 'Reintentar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header with Refresh Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Última actualización: {lastRefreshTime.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          {/* Refresh Mode Toggle */}
          <select
            value={refreshMode}
            onChange={(e) => setRefreshMode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="auto">Auto-refresh</option>
            <option value="manual">Manual</option>
            <option value="paused">Pausado</option>
          </select>
          
          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <svg 
              className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <DashboardDateFilter 
        dateRange={dateRange} 
        onDateRangeChange={setDateRange}
        className="mb-6"
      />

      {/* Performance Alert */}
      {performanceMonitor.getStats()['chart-calculations']?.duration > 1000 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Dashboard cargando lentamente. Considera reducir el rango de fechas para mejor rendimiento.
          </p>
        </div>
      )}

      {/* Stats Cards with Loading States */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatsCard
          title="Ventas Totales"
          value={salesSummary?.totalSales || 0}
          change={null}
          loading={salesLoading}
          icon="💰"
          formatter={(value) => `$${value.toLocaleString()}`}
        />
        <DashboardStatsCard
          title="Pedidos"
          value={salesSummary?.orderCount || 0}
          change={null}
          loading={salesLoading}
          icon="📦"
        />
        <DashboardStatsCard
          title="Pedidos Completados"
          value={salesSummary?.completedOrders || 0}
          change={null}
          loading={salesLoading}
          icon="✅"
        />
        <DashboardStatsCard
          title="Pagos Pendientes"
          value={salesSummary?.pendingPayments || 0}
          change={null}
          loading={salesLoading}
          icon="⏳"
        />
      </div>

      {/* Charts with Enhanced Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChartCard
          title="Ventas por Mes"
          type="line"
          data={chartData.salesByMonth}
          loading={salesLoading}
          height={300}
        />
        <DashboardChartCard
          title="Ventas por Categoría"
          type="doughnut"
          data={chartData.salesByCategory}
          loading={salesLoading}
          height={300}
        />
      </div>

      {/* Additional Dashboard Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardTopItems 
          title="Productos Más Vendidos" 
          data={topItemsData}
          loading={topProductsLoading}
        />
        <DashboardInventoryAlerts 
          products={productsList || []}
          threshold={10}
        />
      </div>

      {/* Recent Activity */}
      <DashboardRecentActivity 
        orders={filteredOrders.length > 0 ? filteredOrders : ordersList || []}
        limit={5}
      />

      {/* Debug Info in Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Dashboard Debug Info</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Refresh Mode: {refreshMode}</p>
            <p>Filtered Orders: {filteredOrders.length}</p>
            <p>Total Orders: {ordersList?.length || 0}</p>
            <p>Date Range: {dateRange ? `${dateRange.start} - ${dateRange.end}` : 'All time'}</p>
            <p>Performance: {JSON.stringify(performanceMonitor.getStats(), null, 2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Usage Notes:
/*
1. Real-time Data Management:
   - Uses useDashboardData hook for automatic refresh
   - Configurable refresh intervals per data type
   - Automatic retry with exponential backoff

2. Performance Optimization:
   - Memoized calculations with useMemo
   - Performance monitoring and alerts
   - Lazy loading of expensive operations

3. Enhanced Error Handling:
   - Graceful error states with retry options
   - Performance warnings for slow operations
   - Debug information in development

4. User Experience:
   - Loading states for all data components
   - Manual refresh controls
   - Real-time status indicators
   - Configurable refresh modes

5. Data Management:
   - Centralized dashboard data manager
   - Smart caching with localStorage
   - Date-filtered calculations
   - Fallback data when real-time fails
*/
