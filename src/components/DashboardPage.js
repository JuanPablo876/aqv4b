import React, { useEffect, useState } from 'react';
import { dashboardData } from '../mock/dashboard';
import { formatCurrency } from '../utils/storage';
import DashboardStatsCard from './DashboardStatsCard';
import DashboardChartCard from './DashboardChartCard';
import DashboardRecentActivity from './DashboardRecentActivity';
import DashboardTopItems from './DashboardTopItems';
import DashboardInventoryAlerts from './DashboardInventoryAlerts';

const DashboardPage = ({ setActivePage, setSelectedOrder, setSelectedMaintenance }) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // In a real app, this would be an API call
    setData(dashboardData);
  }, []);
  
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
  
  if (!data) {
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
          value={formatCurrency(data.salesSummary.daily)}
          change={data.salesSummary.comparedToPrevious.daily}
          color="blue"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          onClick={() => handleStatCardClick('reports')} // Example navigation
        />
        
        <DashboardStatsCard 
          title="Cotizaciones Pendientes" 
          value={data.pendingQuotes}
          color="green"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          onClick={() => handleStatCardClick('quotes')} // Example navigation
        />
        
        <DashboardStatsCard 
          title="Pedidos en Proceso" 
          value={data.pendingOrders}
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
          value={data.lowStockItems}
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
          data={data.salesByMonth}
          type="line"
        />
        
        <DashboardChartCard 
          title="Ventas por Categoría" 
          data={data.salesByCategory}
          type="doughnut"
        />
      </div>
      
      {/* Activity and Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <DashboardRecentActivity activities={data.recentActivity} onActivityClick={handleActivityClick} />
        </div>
        
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-6">
            <DashboardTopItems 
              title="Productos Más Vendidos" 
              items={data.topProducts}
              type="products"
            />
            
            <DashboardTopItems 
              title="Clientes Principales" 
              items={data.topClients}
              type="clients"
            />
          </div>
        </div>
      </div>
      
      {/* Inventory Alerts */}
      <div className="mb-6">
        <DashboardInventoryAlerts alerts={data.inventoryAlerts} onOrderFromInventory={handleOrderFromInventory} />
      </div>
    </div>
  );
};

export default DashboardPage;
// DONE