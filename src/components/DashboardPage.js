import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/storage';
import { getOrderNumber, getQuoteNumber } from '../utils/helpers';
import DashboardStatsCard from './DashboardStatsCard';
import DashboardChartCard from './DashboardChartCard';
import DashboardRecentActivity from './DashboardRecentActivity';
import DashboardTopItems from './DashboardTopItems';
import DashboardInventoryAlerts from './DashboardInventoryAlerts';
import { useData } from '../hooks/useData';

const DashboardPage = ({ setActivePage, setSelectedOrder, setSelectedMaintenance }) => {
  // Use database hooks instead of mock data
  const { data: orders, loading: ordersLoading } = useData('orders');
  const { data: clients, loading: clientsLoading } = useData('clients');
  const { data: products, loading: productsLoading } = useData('products');
  const { data: inventory, loading: inventoryLoading } = useData('inventory');
  const { data: invoices, loading: invoicesLoading } = useData('invoices');
  const { data: transactions, loading: transactionsLoading } = useData('transactions');

  const [dashboardData, setDashboardData] = useState(null);
  
  useEffect(() => {
    // Calculate dashboard data from database entities
    if (!ordersLoading && !clientsLoading && !productsLoading && 
        !inventoryLoading && !invoicesLoading && !transactionsLoading) {
      
      const calculateDashboardData = () => {
        // Calculate sales summary from orders and invoices
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
        
        // Filter orders and invoices for different periods
        const todayOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.toDateString() === currentDate.toDateString();
        }) || [];
        
        const monthlyOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= startOfMonth;
        }) || [];
        
        const yearlyOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= startOfYear;
        }) || [];
        
        // Calculate sales totals
        const dailySales = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const monthlySales = monthlyOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const yearlySales = yearlyOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        // Calculate inventory alerts
        const inventoryAlerts = inventory?.filter(item => {
          const product = products?.find(p => p.id === item.product_id);
          return product && item.quantity <= (product.min_stock || 5);
        }).map(item => {
          const product = products?.find(p => p.id === item.product_id);
          return {
            id: item.id,
            name: product?.name || 'Unknown Product',
            stock: item.quantity,
            minStock: product?.min_stock || 5,
            status: item.quantity === 0 ? 'critical' : 'warning'
          };
        }) || [];
        
        // Add mock inventory alerts if no real data
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
            },
            {
              id: 'mock-alert-3',
              name: 'PH+ Regulador 5L',
              stock: 1,
              minStock: 8,
              status: 'warning'
            }
          );
        }
        
        // Get recent activity from orders (last 10)
        const recentActivity = orders?.slice(-10).reverse().map(order => {
          const client = clients?.find(c => c.id === order.client_id);
          const orderDate = new Date(order.created_at);
          const isValidDate = !isNaN(orderDate.getTime());
          const orderNumber = getOrderNumber(order.id);
          
          return {
            id: order.id,
            type: 'order',
            title: `Pedido #${orderNumber}`,
            subtitle: client?.name || 'Cliente desconocido',
            time: isValidDate ? orderDate.toLocaleTimeString() : 'Fecha inválida',
            value: formatCurrency(order.total || 0),
            date: isValidDate ? orderDate : new Date(),
            description: `Nuevo pedido de ${client?.name || 'cliente'}`,
            status: order.status || 'pending'
          };
        }) || [];
        
        // If no real activity, add some mock recent activity for testing
        if (recentActivity.length === 0) {
          const mockActivity = [
            {
              id: 'mock-1',
              type: 'order',
              title: 'Pedido #1001',
              subtitle: 'Hotel Acapulco',
              time: new Date(Date.now() - 5 * 60000).toLocaleTimeString(),
              value: formatCurrency(2500),
              date: new Date(Date.now() - 5 * 60000),
              description: 'Nuevo pedido de cloro granulado',
              status: 'pending'
            },
            {
              id: 'mock-2',
              type: 'quote',
              title: 'Cotización #2045',
              subtitle: 'Aqua Resort',
              time: new Date(Date.now() - 2 * 3600000).toLocaleTimeString(),
              value: formatCurrency(1800),
              date: new Date(Date.now() - 2 * 3600000),
              description: 'Cotización para equipos de filtración',
              status: 'approved'
            },
            {
              id: 'mock-3',
              type: 'inventory',
              title: 'Inventario actualizado',
              subtitle: 'Sistema',
              time: new Date(Date.now() - 6 * 3600000).toLocaleTimeString(),
              value: '',
              date: new Date(Date.now() - 6 * 3600000),
              description: 'Stock actualizado para 15 productos',
              status: 'completed'
            }
          ];
          recentActivity.push(...mockActivity);
        }
        
        // Calculate top selling products
        const productSales = {};
        orders?.forEach(order => {
          order.items?.forEach(item => {
            const productId = item.product_id || item.productId;
            if (productSales[productId]) {
              productSales[productId].quantity += item.quantity;
              productSales[productId].revenue += item.quantity * (item.price || 0);
            } else {
              const product = products?.find(p => p.id === productId);
              productSales[productId] = {
                id: productId,
                name: product?.name || item.productName || 'Unknown Product',
                quantity: item.quantity,
                revenue: item.quantity * (item.price || 0),
                image: product?.image
              };
            }
          });
        });
        
        const topItems = Object.values(productSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        
        // Add mock data if no real top items
        if (topItems.length === 0) {
          topItems.push(
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
            },
            {
              id: 'mock-p3',
              name: 'Bomba de Agua 1HP',
              quantity: 8,
              revenue: 6400,
              image: null
            },
            {
              id: 'mock-p4',
              name: 'PH+ Regulador',
              quantity: 32,
              revenue: 4200,
              image: null
            },
            {
              id: 'mock-p5',
              name: 'Aspiradora Automática',
              quantity: 3,
              revenue: 3600,
              image: null
            }
          );
        }
        
        // Calculate top clients by order value
        const clientSales = {};
        orders?.forEach(order => {
          const clientId = order.client_id;
          if (clientSales[clientId]) {
            clientSales[clientId].orderCount += 1;
            clientSales[clientId].totalValue += order.total || 0;
          } else {
            const client = clients?.find(c => c.id === clientId);
            clientSales[clientId] = {
              id: clientId,
              name: client?.name || 'Cliente desconocido',
              orderCount: 1,
              totalValue: order.total || 0,
              email: client?.email
            };
          }
        });
        
        const topClients = Object.values(clientSales)
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 5);
        
        // Add mock clients if no real data
        if (topClients.length === 0) {
          topClients.push(
            {
              id: 'mock-c1',
              name: 'Hotel Acapulco Paradise',
              orderCount: 8,
              totalValue: 45000,
              email: 'compras@hotelacapulco.com'
            },
            {
              id: 'mock-c2',
              name: 'Aqua Resort & Spa',
              orderCount: 6,
              totalValue: 32000,
              email: 'mantenimiento@aquaresort.com'
            },
            {
              id: 'mock-c3',
              name: 'Club Deportivo Las Palmas',
              orderCount: 12,
              totalValue: 28500,
              email: 'administracion@clubpalmas.com'
            },
            {
              id: 'mock-c4',
              name: 'Condominio Torre Azul',
              orderCount: 4,
              totalValue: 18900,
              email: 'gerencia@torreazul.com'
            },
            {
              id: 'mock-c5',
              name: 'Spa Wellness Center',
              orderCount: 7,
              totalValue: 15600,
              email: 'spa@wellnesscenter.com'
            }
          );
        }
        
        // Chart data for sales trends (format expected by DashboardChartCard)
        const salesByMonth = [
          { month: 'Ene', sales: 65000 },
          { month: 'Feb', sales: 59000 },
          { month: 'Mar', sales: 80000 },
          { month: 'Abr', sales: 81000 },
          { month: 'May', sales: 56000 },
          { month: 'Jun', sales: 75000 }
        ];

        // Sales by category - ensure proper structure for doughnut chart
        const salesByCategory = [
          { category: 'Químicos', sales: 45000, percentage: 39.1, color: '#3b82f6' },
          { category: 'Equipos', sales: 32000, percentage: 27.8, color: '#10b981' },
          { category: 'Mantenimiento', sales: 23000, percentage: 20.0, color: '#f59e0b' },
          { category: 'Otros', sales: 15000, percentage: 13.1, color: '#ef4444' }
        ];

        return {
          salesSummary: {
            daily: dailySales,
            monthly: monthlySales,
            yearly: yearlySales
          },
          ordersSummary: {
            total: orders?.length || 0,
            pending: orders?.filter(o => o.status === 'pending')?.length || 0,
            completed: orders?.filter(o => o.status === 'completed')?.length || 0
          },
          clientsSummary: {
            total: clients?.length || 0,
            active: clients?.filter(c => c.status === 'active')?.length || 0
          },
          productsSummary: {
            total: products?.length || 0,
            lowStock: inventoryAlerts.length
          },
          inventoryAlerts,
          recentActivity,
          topItems,
          topClients,
          // Chart data in the format expected by DashboardChartCard
          salesByMonth,
          salesByCategory
        };
      };
      
      setDashboardData(calculateDashboardData());
    }
  }, [orders, clients, products, inventory, invoices, transactions, 
      ordersLoading, clientsLoading, productsLoading, inventoryLoading, 
      invoicesLoading, transactionsLoading]);
  
  // Handle click on a stat card
  const handleStatCardClick = (page) => {
    setActivePage(page);
  };
  
  // Handle click on a recent activity item
  const handleActivityClick = (activity) => {
    if (activity.type === 'order') {
      // In a real app, you'd fetch the specific order details
      // For now, we'll just navigate to the orders page
      setActivePage('orders');
      // Optionally, you could try to pre-select the order in the OrdersPage
      // setSelectedOrder({ id: activity.id }); // This would require more complex state management
    } else if (activity.type === 'quote') {
      // Navigate to quotes page
      setActivePage('quotes');
    } else if (activity.type === 'inventory') {
      // Navigate to inventory page
      setActivePage('inventory');
    } else if (activity.type === 'client') {
      // Navigate to clients page
      setActivePage('clients');
    }
     // Add other activity types as needed
  };
  
  // Handle order from inventory alert (placeholder)
  const handleOrderFromInventory = (product) => {
    console.log(`Simulando creación de pedido de compra para producto: ${product.name}`);
    // In a real app, this would navigate to the order creation page
    // or open a modal to create a purchase order for this product.
    alert(`Funcionalidad "Realizar Pedido" para ${product.name} pendiente de implementar.`);
  };
  
  if (!dashboardData || ordersLoading || clientsLoading || productsLoading || inventoryLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DashboardStatsCard 
          title="Ventas Diarias" 
          value={formatCurrency(dashboardData.salesSummary.daily)}
          change="+12.5%"
          color="blue"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          onClick={() => handleStatCardClick('reports')} // Example navigation
        />
        
        <DashboardStatsCard 
          title="Pedidos Totales" 
          value={dashboardData.ordersSummary.total}
          color="green"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          onClick={() => handleStatCardClick('orders')} // Example navigation
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
          onClick={() => handleStatCardClick('orders')} // Example navigation
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
          onClick={() => handleStatCardClick('inventory')} // Example navigation
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
          <DashboardRecentActivity activities={dashboardData.recentActivity} onActivityClick={handleActivityClick} />
        </div>
        
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-6">
            <DashboardTopItems 
              title="Productos Más Vendidos" 
              items={dashboardData.topItems}
              type="products"
            />
            
            <DashboardTopItems 
              title="Clientes Principales" 
              items={dashboardData.topClients}
              type="clients"
            />
          </div>
        </div>
      </div>
      
      {/* Inventory Alerts */}
      <div className="mb-6">
        <DashboardInventoryAlerts alerts={dashboardData.inventoryAlerts} onOrderFromInventory={handleOrderFromInventory} />
      </div>
    </div>
  );
};

export default DashboardPage;
// DONE
