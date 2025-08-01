import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/storage';
import { getOrderNumber, getQuoteNumber } from '../utils/helpers';
import DashboardStatsCard from './DashboardStatsCard';
import DashboardChartCard from './DashboardChartCard';
import DashboardRecentActivity from './DashboardRecentActivity';
import DashboardTopItems from './DashboardTopItems';
import DashboardInventoryAlerts from './DashboardInventoryAlerts';
import DashboardDateFilter from './DashboardDateFilter';
import { useData } from '../hooks/useData';

const DashboardPage = ({ setActivePage, setSelectedOrder, setSelectedMaintenance }) => {
  // Use database hooks
  const { data: orders = [], loading: ordersLoading } = useData('orders');
  const { data: clients = [], loading: clientsLoading } = useData('clients');
  const { data: products = [], loading: productsLoading } = useData('products');
  const { data: inventory = [], loading: inventoryLoading } = useData('inventory');
  const { data: invoices = [], loading: invoicesLoading } = useData('invoices');
  const { data: transactions = [], loading: transactionsLoading } = useData('transactions');

  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  
  const allLoading = ordersLoading || clientsLoading || productsLoading || 
                   inventoryLoading || invoicesLoading || transactionsLoading;

  // Calculate dashboard data when data or date range changes
  useEffect(() => {
    if (!allLoading) {
      console.log('🔍 Dashboard Debug:', {
        ordersCount: orders?.length || 0,
        hasRealData: orders && orders.length > 0,
        dateRange
      });

      const calculateDashboardData = () => {
        // Use real orders if available, mock data otherwise
        let workingOrders = orders && orders.length > 0 ? orders : [];
        
        // Add mock data if no real data exists
        if (workingOrders.length === 0) {
          console.log('⚠️ Using mock data for dashboard');
          const today = new Date();
          workingOrders = [
            {
              id: 'mock-1',
              client_id: 'mock-client-1',
              total: 2500.00,
              status: 'completed',
              created_at: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'mock-2', 
              client_id: 'mock-client-1',
              total: 1800.00,
              status: 'pending',
              created_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'mock-3',
              client_id: 'mock-client-1', 
              total: 3200.00,
              status: 'completed',
              created_at: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
            }
          ];
        }

        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
        
        // Filter orders based on date range
        let filteredOrders = workingOrders;
        let salesValue = 0;
        
        if (dateRange) {
          filteredOrders = workingOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
          });
          salesValue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        } else {
          // Default to today's orders for daily sales
          filteredOrders = workingOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate.toDateString() === currentDate.toDateString();
          });
          salesValue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        }
        
        // Calculate monthly and yearly totals
        const monthlyOrders = workingOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= startOfMonth;
        });
        
        const yearlyOrders = workingOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= startOfYear;
        });
        
        const monthlySales = monthlyOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const yearlySales = yearlyOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        // Calculate percentage change
        const yesterday = new Date(currentDate);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yesterdayOrders = workingOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.toDateString() === yesterday.toDateString();
        });
        
        const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        let percentageChange = '0.0%';
        if (yesterdaySales > 0) {
          const change = ((salesValue - yesterdaySales) / yesterdaySales * 100).toFixed(1);
          percentageChange = change > 0 ? `+${change}%` : `${change}%`;
        } else if (salesValue > 0) {
          percentageChange = '+100.0%';
        }
        
        // Calculate inventory alerts
        const inventoryAlerts = inventory.filter(item => {
          const product = products.find(p => p.id === item.product_id);
          return product && item.quantity <= (product.min_stock || 5);
        }).map(item => {
          const product = products.find(p => p.id === item.product_id);
          return {
            id: item.id,
            name: product?.name || 'Unknown Product',
            stock: item.quantity,
            minStock: product?.min_stock || 5,
            status: item.quantity === 0 ? 'critical' : 'warning'
          };
        });
        
        // Add mock alerts if no real data
        if (inventoryAlerts.length === 0) {
          inventoryAlerts.push(
            {
              id: 'mock-alert-1',
              name: 'Cloro Granulado HTH 25kg',
              stock: 2,
              minStock: 10,
              status: 'warning'
            },
            {
              id: 'mock-alert-2',
              name: 'Kit de Filtros Pentair',
              stock: 0,
              minStock: 5,
              status: 'critical'
            }
          );
        }
        
        // Recent activity
        const recentActivity = workingOrders.slice(-5).reverse().map(order => {
          const client = clients.find(c => c.id === order.client_id);
          const orderDate = new Date(order.created_at);
          const isValidDate = !isNaN(orderDate.getTime());
          const orderNumber = getOrderNumber ? getOrderNumber(order.id) : order.id.slice(-4);
          
          return {
            id: order.id,
            type: 'order',
            title: `Pedido #${orderNumber}`,
            subtitle: client?.name || 'Cliente de prueba',
            time: isValidDate ? orderDate.toLocaleTimeString() : 'Fecha inválida',
            value: formatCurrency(order.total || 0),
            date: isValidDate ? orderDate : new Date(),
            description: `Nuevo pedido de ${client?.name || 'cliente'}`,
            status: order.status || 'pending'
          };
        });
        
        // Top items
        const topItems = [
          {
            id: 'mock-p1',
            name: 'Cloro Granulado HTH',
            quantity: 45,
            revenue: 12500,
            image: null
          },
          {
            id: 'mock-p2',
            name: 'Kit de Filtros',
            quantity: 12,
            revenue: 8900,
            image: null
          }
        ];
        
        // Top clients
        const topClients = [
          {
            id: 'mock-c1',
            name: 'Hotel Acapulco Paradise',
            orderCount: 8,
            totalValue: 45000,
            email: 'compras@hotelacapulco.com'
          }
        ];
        
        // Chart data
        const salesByMonth = [
          { month: 'Ene', sales: 65000 },
          { month: 'Feb', sales: 59000 },
          { month: 'Mar', sales: 80000 },
          { month: 'Abr', sales: 81000 },
          { month: 'May', sales: 56000 },
          { month: 'Jun', sales: 75000 }
        ];

        const salesByCategory = [
          { category: 'Químicos', sales: 45000, percentage: 39.1, color: '#3b82f6' },
          { category: 'Equipos', sales: 32000, percentage: 27.8, color: '#10b981' },
          { category: 'Mantenimiento', sales: 23000, percentage: 20.0, color: '#f59e0b' },
          { category: 'Otros', sales: 15000, percentage: 13.1, color: '#ef4444' }
        ];

        console.log('📊 Calculated Dashboard Data:', {
          salesValue,
          percentageChange,
          ordersTotal: workingOrders.length,
          filteredCount: filteredOrders.length
        });

        return {
          salesSummary: {
            daily: salesValue,
            monthly: monthlySales,
            yearly: yearlySales,
            dailyChange: percentageChange
          },
          ordersSummary: {
            total: workingOrders.length,
            pending: workingOrders.filter(o => o.status === 'pending').length,
            completed: workingOrders.filter(o => o.status === 'completed').length,
            filtered: filteredOrders.length
          },
          clientsSummary: {
            total: clients.length,
            active: clients.filter(c => c.status === 'active').length
          },
          productsSummary: {
            total: products.length,
            lowStock: inventoryAlerts.length
          },
          inventoryAlerts,
          recentActivity,
          topItems,
          topClients,
          salesByMonth,
          salesByCategory
        };
      };
      
      setDashboardData(calculateDashboardData());
    }
  }, [orders, clients, products, inventory, invoices, transactions, 
      ordersLoading, clientsLoading, productsLoading, inventoryLoading, 
      invoicesLoading, transactionsLoading, dateRange]);
  
  // Get sales title based on date range
  const getSalesTitle = () => {
    if (!dateRange) return 'Ventas Diarias';
    
    const titleMap = {
      'today': 'Ventas de Hoy',
      'yesterday': 'Ventas de Ayer', 
      'last7days': 'Ventas (Últimos 7 días)',
      'last30days': 'Ventas (Últimos 30 días)',
      'thisMonth': 'Ventas del Mes',
      'lastMonth': 'Ventas del Mes Pasado',
      'last3months': 'Ventas (Últimos 3 meses)',
      'thisYear': 'Ventas del Año',
      'custom': 'Ventas (Personalizado)'
    };
    
    return titleMap[dateRange.filterId] || 'Ventas del Período';
  };

  // Handle navigation
  const handleStatCardClick = (page) => {
    if (setActivePage) {
      setActivePage(page);
    }
  };

  const handleActivityClick = (activity) => {
    if (activity.type === 'order' && setSelectedOrder) {
      setSelectedOrder(activity.id);
      setActivePage('orders');
    }
  };

  const handleViewAllActivity = () => {
    setActivePage('orders');
  };

  // Loading state
  if (allLoading || !dashboardData) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Resumen de actividad y métricas clave</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Período de análisis
          </label>
          <DashboardDateFilter 
            onDateRangeChange={setDateRange}
            currentRange={dateRange?.filterId}
          />
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DashboardStatsCard 
          title={getSalesTitle()} 
          value={formatCurrency(dashboardData.salesSummary.daily)}
          change={dashboardData.salesSummary.dailyChange}
          color="blue"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          onClick={() => handleStatCardClick('reports')}
        />
        
        <DashboardStatsCard 
          title="Pedidos Totales" 
          value={dateRange ? dashboardData.ordersSummary.filtered : dashboardData.ordersSummary.total}
          color="green"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          onClick={() => handleStatCardClick('orders')}
        />
        
        <DashboardStatsCard 
          title="Pedidos en Proceso" 
          value={dashboardData.ordersSummary.pending}
          color="purple"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          onClick={() => handleStatCardClick('orders')}
        />
        
        <DashboardStatsCard 
          title="Productos Bajo Stock" 
          value={dashboardData.productsSummary.lowStock}
          color="amber"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          onClick={() => handleStatCardClick('inventory')}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DashboardChartCard 
          title="Ventas Mensuales" 
          data={dashboardData.salesByMonth}
          type="line"
        />
        
        <DashboardChartCard 
          title="Ventas por Categoría" 
          data={dashboardData.salesByCategory}
          type="doughnut"
        />
      </div>
      
      {/* Activity and Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <DashboardRecentActivity 
            activities={dashboardData.recentActivity} 
            onActivityClick={handleActivityClick} 
            onViewAll={handleViewAllActivity}
          />
        </div>
        
        <div className="lg:col-span-1">
          <DashboardTopItems 
            items={dashboardData.topItems}
            title="Productos Más Vendidos"
          />
        </div>
        
        <div className="lg:col-span-1">
          <DashboardInventoryAlerts 
            alerts={dashboardData.inventoryAlerts}
            onViewInventory={() => handleStatCardClick('inventory')}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
