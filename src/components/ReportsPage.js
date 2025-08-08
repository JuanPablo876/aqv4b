import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/storage';
import { useData } from '../hooks/useData';
import { handleError, handleSuccess } from '../utils/errorHandling';
import reportsService from '../services/reportsService';
import VenetianTile from './VenetianTile';
import ProtectedRoute from './ProtectedRoute';
import CustomReportBuilder from './CustomReportBuilder';

const ReportsPageContent = () => {
  const { data: invoicesList, loading: invoicesLoading } = useData('invoices');
  const { data: productsList, loading: productsLoading } = useData('products');
  const { data: clientsList, loading: clientsLoading } = useData('clients');
  const { data: inventoryList, loading: inventoryLoading } = useData('inventory');
  
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tab, setTab] = useState('standard');
  
  // Real data states
  const [reportsData, setReportsData] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [salesByCategory, setSalesByCategory] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Load reports data on component mount and date range change
  useEffect(() => {
    loadReportsData();
  }, [dateRange]);

  const loadReportsData = async () => {
    try {
      setReportsLoading(true);
      const [summary, sales, inventory, salesCat, products, clients] = await Promise.all([
        reportsService.getReportsSummary(dateRange),
        reportsService.getSalesReport(dateRange),
        reportsService.getInventoryReport(),
        reportsService.getSalesByCategory(dateRange),
        reportsService.getTopProductsReport(dateRange, 10),
        reportsService.getClientPerformanceReport(dateRange, 10)
      ]);

      setReportsData(summary);
      setSalesReport(sales);
      setInventoryReport(inventory);
      setSalesByCategory(salesCat);
      setTopProducts(products.topProducts);
      setTopClients(clients.topClients);
    } catch (error) {
      console.error('Error loading reports data:', error);
      handleError(error, 'load reports data', 'Error al cargar los reportes');
    } finally {
      setReportsLoading(false);
    }
  };
  
  const loading = invoicesLoading || productsLoading || clientsLoading || inventoryLoading || reportsLoading;

  // Calculate filtered data based on date range - now using real data
  const getFilteredData = () => {
    if (!salesReport) {
      return {
        invoices: [],
        totalSales: 0,
        count: 0
      };
    }

    return {
      invoices: [], // Individual invoices can be added if needed
      totalSales: salesReport.totalSales,
      count: salesReport.totalOrders + salesReport.totalInvoices
    };
  };

  // Get real category data from sales by category report
  const getCategoryData = () => {
    if (!salesByCategory || !salesByCategory.salesByCategory) {
      return [];
    }

    const totalRevenue = salesByCategory.totalRevenue;
    return salesByCategory.salesByCategory.map(category => ({
      category: category.category,
      percentage: totalRevenue > 0 ? Math.round((category.totalRevenue / totalRevenue) * 100) : 0,
      value: category.totalRevenue,
      items: category.totalQuantity,
      orderCount: category.orderCount
    }));
  };

  // Get real sales data from sales report
  const getSalesData = () => {
    if (!salesReport || !salesReport.salesByPeriod) {
      return [];
    }

    return salesReport.salesByPeriod.map(period => ({
      period: period.period,
      sales: period.sales,
      orders: period.orders,
      invoices: period.invoices
    }));
  };

  const filteredData = getFilteredData();
  const categoryData = getCategoryData();
  const salesData = getSalesData();
  
  // Handle generate report
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      await loadReportsData();
      handleSuccess('Reporte generado exitosamente');
    } catch (error) {
      handleError(error, 'generate report', 'Error al generar el reporte');
    } finally {
      setIsGenerating(false);
    }
  };

  // Get date range label
  const getDateRangeLabel = () => {
    const labels = {
      'day': 'Hoy',
      'week': 'Esta Semana', 
      'month': 'Este Mes',
      'quarter': 'Este Trimestre',
      'year': 'Este Año',
      'custom': 'Personalizado'
    };
    return labels[dateRange] || 'Este Mes';
  };
  
  // Render different report content based on type
  const renderReportContent = () => {
    if (tab === 'custom') {
      return <CustomReportBuilder />;
    }

    switch (reportType) {
      case 'sales':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-primary dark:text-dark-100">Reporte de Ventas</h3>
              <span className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full dark:bg-dark-600 dark:text-dark-200">
                {getDateRangeLabel()}
              </span>
            </div>
            
            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <VenetianTile className="p-4 dark:border-dark-600 dark:bg-dark-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary dark:text-dark-100">{formatCurrency(filteredData.totalSales)}</div>
                  <div className="text-sm text-muted-foreground dark:text-dark-300">Total de Ventas</div>
                </div>
              </VenetianTile>
              <VenetianTile className="p-4 dark:border-dark-600 dark:bg-dark-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary dark:text-dark-100">{filteredData.count}</div>
                  <div className="text-sm text-muted-foreground dark:text-dark-300">Transacciones</div>
                </div>
              </VenetianTile>
              <VenetianTile className="p-4 dark:border-dark-600 dark:bg-dark-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary dark:text-dark-100">{salesReport ? salesReport.totalOrders : 0}</div>
                  <div className="text-sm text-muted-foreground dark:text-dark-300">Pedidos</div>
                </div>
              </VenetianTile>
              <VenetianTile className="p-4 dark:border-dark-600 dark:bg-dark-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary dark:text-dark-100">
                    {salesReport ? formatCurrency(salesReport.averageOrderValue) : formatCurrency(0)}
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-dark-300">Promedio por Orden</div>
                </div>
              </VenetianTile>
            </div>
            
            <VenetianTile className="overflow-hidden mb-6 dark:border-dark-600 dark:bg-dark-700">
              <div className="p-6">
                <h4 className="text-md font-medium text-primary mb-4 dark:text-dark-100">Ventas por Periodo</h4>
                <div className="h-80">
                  <div className="h-full w-full bg-secondary rounded-lg flex items-center justify-center dark:bg-dark-600">
                    <div className="w-full px-6">
                      {salesData.length > 0 ? salesData.map((item, index) => (
                        <div key={index} className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-muted-foreground dark:text-dark-300">{item.period}</span>
                            <span className="text-sm font-medium text-foreground dark:text-dark-100">{formatCurrency(item.sales)}</span>
                          </div>
                          <div className="w-full bg-border rounded-full h-2 dark:bg-dark-500">
                            <div 
                              className="bg-primary h-2 rounded-full dark:bg-blue-400" 
                              style={{ width: `${salesData.length > 0 ? (item.sales / Math.max(...salesData.map(d => d.sales))) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground dark:text-dark-300">No hay datos de ventas para mostrar</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </VenetianTile>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VenetianTile className="overflow-hidden dark:border-dark-600 dark:bg-dark-700">
                <div className="p-6">
                  <h4 className="text-md font-medium text-primary mb-4 dark:text-dark-100">Ventas por Categoría</h4>
                  <div className="space-y-3">
                    {categoryData.length > 0 ? categoryData.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground dark:text-dark-300">{item.category}</span>
                          <span className="text-sm font-medium text-foreground dark:text-dark-100">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-border rounded-full h-2 dark:bg-dark-500">
                          <div 
                            className={`h-2 rounded-full bg-primary dark:bg-blue-400`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground dark:text-dark-300">No hay datos de categorías</p>
                      </div>
                    )}
                  </div>
                </div>
              </VenetianTile>

              <VenetianTile className="overflow-hidden dark:border-dark-600 dark:bg-dark-700">
                <div className="p-6">
                  <h4 className="text-md font-medium text-primary mb-4 dark:text-dark-100">Productos Más Vendidos</h4>
                  <div className="space-y-3">
                    {topProducts.length > 0 ? topProducts.slice(0, 5).map((product, index) => (
                      <div key={product.product_id} className="flex items-center justify-between p-3 bg-secondary rounded-lg dark:bg-dark-600">
                        <div>
                          <div className="font-medium text-foreground dark:text-dark-100">{product.name}</div>
                          <div className="text-sm text-muted-foreground dark:text-dark-300">
                            {product.totalQuantity} unidades
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary dark:text-dark-100">{formatCurrency(product.totalRevenue)}</div>
                          <div className="text-sm text-muted-foreground dark:text-dark-300">{product.orderCount} pedidos</div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground dark:text-dark-300">No hay datos de productos</p>
                      </div>
                    )}
                  </div>
                </div>
              </VenetianTile>
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-primary dark:text-dark-100">Reporte de Inventario</h3>
              <span className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full dark:bg-dark-600 dark:text-dark-200">
                Tiempo Real
              </span>
            </div>
            
            {/* Inventory Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <VenetianTile className="p-4 dark:border-dark-600 dark:bg-dark-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary dark:text-dark-100">{inventoryReport ? inventoryReport.totalItems : 0}</div>
                  <div className="text-sm text-muted-foreground dark:text-dark-300">Total de Productos</div>
                </div>
              </VenetianTile>
              <VenetianTile className="p-4 dark:border-dark-600 dark:bg-dark-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary dark:text-dark-100">
                    {inventoryReport ? formatCurrency(inventoryReport.totalValue) : formatCurrency(0)}
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-dark-300">Valor Total</div>
                </div>
              </VenetianTile>
              <VenetianTile className="p-4 dark:border-dark-600 dark:bg-dark-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{inventoryReport ? inventoryReport.lowStockCount : 0}</div>
                  <div className="text-sm text-muted-foreground dark:text-dark-300">Stock Bajo</div>
                </div>
              </VenetianTile>
              <VenetianTile className="p-4 dark:border-dark-600 dark:bg-dark-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{inventoryReport ? inventoryReport.outOfStockCount : 0}</div>
                  <div className="text-sm text-muted-foreground dark:text-dark-300">Sin Stock</div>
                </div>
              </VenetianTile>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VenetianTile className="overflow-hidden dark:border-dark-600 dark:bg-dark-700">
                <div className="p-6">
                  <h4 className="text-md font-medium text-primary mb-4 dark:text-dark-100">Inventario por Categoría</h4>
                  <div className="space-y-3">
                    {categoryData.length > 0 ? categoryData.map((category, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground dark:text-dark-300">{category.category}</span>
                          <span className="text-sm font-medium text-foreground dark:text-dark-100">{category.items} items</span>
                        </div>
                        <div className="w-full bg-border rounded-full h-2 dark:bg-dark-500">
                          <div 
                            className="h-2 rounded-full bg-primary dark:bg-blue-400"
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground dark:text-dark-300">No hay datos de categorías</p>
                      </div>
                    )}
                  </div>
                </div>
              </VenetianTile>

              <VenetianTile className="overflow-hidden dark:border-dark-600 dark:bg-dark-700">
                <div className="p-6">
                  <h4 className="text-md font-medium text-primary mb-4 dark:text-dark-100">Productos con Stock Bajo</h4>
                  <div className="space-y-3">
                    {inventoryReport && inventoryReport.lowStockItems.length > 0 ? 
                      inventoryReport.lowStockItems.slice(0, 5).map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg dark:bg-dark-600">
                          <div>
                            <div className="font-medium text-foreground dark:text-dark-100">{item.products?.name || 'Producto'}</div>
                            <div className="text-sm text-muted-foreground dark:text-dark-300">
                              Categoría: {item.products?.category || 'N/A'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600 dark:text-red-400">{item.quantity}</div>
                            <div className="text-sm text-muted-foreground dark:text-dark-300">Min: {item.min_stock}</div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground dark:text-dark-300">No hay productos con stock bajo</p>
                        </div>
                      )
                    }
                  </div>
                </div>
              </VenetianTile>
            </div>
          </div>
        );

      case 'clients':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-primary dark:text-dark-100">Reporte de Clientes</h3>
              <span className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full dark:bg-dark-600 dark:text-dark-200">
                {getDateRangeLabel()}
              </span>
            </div>
            
            {/* Client Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <VenetianTile className="p-4 dark:border-dark-600 dark:bg-dark-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary dark:text-dark-100">{topClients.length}</div>
                  <div className="text-sm text-muted-foreground dark:text-dark-300">Clientes Activos</div>
                </div>
              </VenetianTile>
              <VenetianTile className="p-4 dark:border-dark-600 dark:bg-dark-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary dark:text-dark-100">
                    {topClients.length > 0 ? formatCurrency(topClients.reduce((sum, client) => sum + client.totalSpent, 0)) : formatCurrency(0)}
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-dark-300">Ingresos Totales</div>
                </div>
              </VenetianTile>
              <VenetianTile className="p-4 dark:border-dark-600 dark:bg-dark-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary dark:text-dark-100">
                    {topClients.length > 0 ? formatCurrency(topClients.reduce((sum, client) => sum + client.averageOrderValue, 0) / topClients.length) : formatCurrency(0)}
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-dark-300">Valor Promedio</div>
                </div>
              </VenetianTile>
            </div>

            <VenetianTile className="overflow-hidden dark:border-dark-600 dark:bg-dark-700">
              <div className="p-6">
                <h4 className="text-md font-medium text-primary mb-4 dark:text-dark-100">Mejores Clientes</h4>
                <div className="space-y-3">
                  {topClients.length > 0 ? topClients.map((client, index) => (
                    <div key={client.client_id} className="flex items-center justify-between p-4 bg-secondary rounded-lg dark:bg-dark-600">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold mr-3 dark:bg-blue-600">
                          {(index + 1)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground dark:text-dark-100">{client.name}</div>
                          <div className="text-sm text-muted-foreground dark:text-dark-300">
                            {client.contact && `${client.contact} • `}{client.totalOrders} pedidos
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary dark:text-dark-100">{formatCurrency(client.totalSpent)}</div>
                        <div className="text-sm text-muted-foreground dark:text-dark-300">
                          Promedio: {formatCurrency(client.averageOrderValue)}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground dark:text-dark-300">No hay datos de clientes disponibles</p>
                    </div>
                  )}
                </div>
              </div>
            </VenetianTile>
          </div>
        );

      default:
        return <div className="text-center py-8 text-muted-foreground dark:text-dark-300">Selecciona un tipo de reporte</div>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground dark:text-dark-300">Cargando reportes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-primary mb-4 md:mb-0 dark:text-dark-100">Reportes</h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          {/* Report Type Selector */}
          <select
            className="px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-dark-600 dark:border-dark-500 dark:text-dark-200"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="sales">Reporte de Ventas</option>
            <option value="inventory">Reporte de Inventario</option>
            <option value="clients">Reporte de Clientes</option>
          </select>
          
          {/* Date Range Selector */}
          <select
            className="px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-dark-600 dark:border-dark-500 dark:text-dark-200"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="day">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Año</option>
          </select>
          
          {/* Generate Report Button */}
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            <div className="flex items-center">
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              {isGenerating ? 'Generando...' : 'Actualizar Reporte'}
            </div>
          </button>
        </div>
      </div>
      <div className="mb-4 flex gap-2 border-b">
        <button onClick={() => setTab('standard')} className={`px-4 py-2 text-sm border-b-2 ${tab==='standard' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Estándar</button>
        <button onClick={() => setTab('custom')} className={`px-4 py-2 text-sm border-b-2 ${tab==='custom' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Personalizados</button>
      </div>
      <div className="space-y-6">
        {renderReportContent()}
      </div>
    </div>
  );
};

const ReportsPage = () => {
  return (
    <ProtectedRoute 
      requiredPermission="view_reports"
      fallback={
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Access Restricted</h3>
            <p className="text-yellow-700">You don't have permission to view reports.</p>
          </div>
        </div>
      }
    >
      <ReportsPageContent />
    </ProtectedRoute>
  );
};

export default ReportsPage;
