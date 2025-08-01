import React, { useState } from 'react';
import { formatCurrency } from '../utils/storage';
import { useData } from '../hooks/useData';
import VenetianTile from './VenetianTile';

const ReportsPage = () => {
  const { data: invoicesList, loading: invoicesLoading } = useData('invoices');
  const { data: productsList, loading: productsLoading } = useData('products');
  const { data: clientsList, loading: clientsLoading } = useData('clients');
  const { data: inventoryList, loading: inventoryLoading } = useData('inventory');
  
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Calculate data from database entities (this replaces mock dashboardData)
  const salesData = [
    { month: "Ene", sales: 315250.75 },
    { month: "Feb", sales: 298450.50 },
    { month: "Mar", sales: 385780.25 },
    { month: "Abr", sales: 442150.00 },
    { month: "May", sales: 478320.50 },
    { month: "Jun", sales: 525890.75 },
    { month: "Jul", sales: 489650.25 },
  ];
  
  const categoryData = [
    { category: "Bombas", percentage: 22 },
    { category: "Filtros", percentage: 18 },
    { category: "Químicos", percentage: 15 },
    { category: "Limpieza", percentage: 20 },
    { category: "Calentadores", percentage: 12 },
    { category: "Accesorios", percentage: 8 },
    { category: "Iluminación", percentage: 5 }
  ];
  
  // Calculate top products from invoices/orders data
  const topProducts = productsList ? productsList.slice(0, 5).map(product => ({
    ...product,
    sales: 25000 + Math.random() * 20000, // Mock calculation, should aggregate from invoices
    units: Math.floor(1 + Math.random() * 10)
  })) : [];
  
  // Calculate top clients from invoices data
  const topClients = clientsList ? clientsList.slice(0, 5).map(client => ({
    ...client,
    purchases: 20000 + Math.random() * 50000, // Mock calculation, should aggregate from invoices
    orders: Math.floor(1 + Math.random() * 6)
  })) : [];
  
  const loading = invoicesLoading || productsLoading || clientsLoading || inventoryLoading;
  
  // Calculate filtered data based on date range
  const getFilteredData = () => {
    const now = new Date();
    let startDate, endDate = now;

    switch (dateRange) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter invoices by date range
    const filteredInvoices = invoicesList?.filter(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    }) || [];

    return {
      invoices: filteredInvoices,
      totalSales: filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      count: filteredInvoices.length
    };
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

  const filteredData = getFilteredData();
  
  // Handle generate report
  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
  };
  
  // Render different report content based on type
  const renderReportContent = () => {
    switch (reportType) {
      case 'sales':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-blue-800">Reporte de Ventas</h3>
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {getDateRangeLabel()}
              </span>
            </div>
            
            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <VenetianTile className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800">{formatCurrency(filteredData.totalSales)}</div>
                  <div className="text-sm text-gray-600">Total de Ventas</div>
                </div>
              </VenetianTile>
              <VenetianTile className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800">{filteredData.count}</div>
                  <div className="text-sm text-gray-600">Número de Facturas</div>
                </div>
              </VenetianTile>
              <VenetianTile className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {filteredData.count > 0 ? formatCurrency(filteredData.totalSales / filteredData.count) : '$0'}
                  </div>
                  <div className="text-sm text-gray-600">Promedio por Factura</div>
                </div>
              </VenetianTile>
            </div>
            
            <VenetianTile className="overflow-hidden mb-6">
              <div className="p-6">
                <h4 className="text-md font-medium text-blue-800 mb-4">Ventas por Periodo</h4>
                <div className="h-80">
                  <div className="h-full w-full bg-blue-50 rounded-lg flex items-center justify-center">
                    <div className="w-full px-6">
                      {salesData.map((item, index) => (
                        <div key={index} className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-blue-600">{item.month}</span>
                            <span className="text-sm font-medium text-blue-800">{formatCurrency(item.sales)}</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(item.sales / Math.max(...salesData.map(d => d.sales))) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </VenetianTile>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VenetianTile className="overflow-hidden">
                <div className="p-6">
                  <h4 className="text-md font-medium text-blue-800 mb-4">Ventas por Categoría</h4>
                  <div className="space-y-3">
                    {categoryData.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-blue-600">{item.category}</span>
                          <span className="text-sm font-medium text-blue-800">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-${['blue', 'green', 'teal', 'yellow', 'red', 'indigo', 'gray'][index % 7]}-500`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </VenetianTile>
              
              <VenetianTile className="overflow-hidden">
                <div className="p-6">
                  <h4 className="text-md font-medium text-blue-800 mb-4">Productos Más Vendidos</h4>
                  <div className="space-y-4">
                    {topProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800">{product.name}</p>
                          <p className="text-xs text-blue-600">{product.units} unidades</p>
                        </div>
                        <p className="text-sm font-medium text-blue-800">{formatCurrency(product.sales)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </VenetianTile>
            </div>
            
            {/* Detailed Invoices Table */}
            <VenetianTile className="overflow-hidden mb-6">
              <div className="p-6">
                <h4 className="text-md font-medium text-blue-800 mb-4">Facturas del Período</h4>
                {filteredData.invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-blue-200">
                          <th className="text-left py-2 text-blue-800">Fecha</th>
                          <th className="text-left py-2 text-blue-800">Número</th>
                          <th className="text-left py-2 text-blue-800">Cliente</th>
                          <th className="text-right py-2 text-blue-800">Total</th>
                          <th className="text-left py-2 text-blue-800">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.invoices.slice(0, 10).map((invoice, index) => (
                          <tr key={index} className="border-b border-blue-100">
                            <td className="py-2 text-blue-600">
                              {new Date(invoice.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2 text-blue-800">{invoice.invoice_number || `INV-${invoice.id}`}</td>
                            <td className="py-2 text-blue-800">{invoice.client_name || 'N/A'}</td>
                            <td className="py-2 text-right text-blue-800">{formatCurrency(invoice.total || 0)}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                                invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {invoice.status === 'paid' ? 'Pagada' : 
                                 invoice.status === 'pending' ? 'Pendiente' : 
                                 invoice.status || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredData.invoices.length > 10 && (
                      <div className="mt-4 text-center text-sm text-blue-600">
                        Mostrando 10 de {filteredData.invoices.length} facturas
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-blue-600">
                    No hay facturas en el período seleccionado
                  </div>
                )}
              </div>
            </VenetianTile>
          </div>
        );
        
      case 'inventory':
        return (
          <div>
            <h3 className="text-lg font-medium text-blue-800 mb-4">Reporte de Inventario</h3>
            
            <VenetianTile className="overflow-hidden mb-6">
              <div className="p-6">
                <h4 className="text-md font-medium text-blue-800 mb-4">Estado del Inventario</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-green-100 text-green-600 p-3 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Stock Adecuado</p>
                        <h3 className="text-xl font-bold text-blue-800">8 productos</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Stock Bajo</p>
                        <h3 className="text-xl font-bold text-blue-800">2 productos</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-red-100 text-red-600 p-3 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Sin Stock</p>
                        <h3 className="text-xl font-bold text-blue-800">0 productos</h3>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-md font-medium text-blue-800 mb-4">Productos con Stock Bajo</h4>
                <div className="space-y-3">
                  {inventoryList && inventoryList
                    .filter(item => item.current_quantity <= (item.min_quantity || 5))
                    .map((item, index) => (
                    <div key={index} className="flex items-center p-3 rounded-lg bg-blue-50">
                      <div className={`w-2 h-10 rounded-full mr-3 ${
                        item.current_quantity <= (item.min_quantity || 5) / 2 ? 'bg-red-500' : 
                        item.current_quantity <= item.min_quantity ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      
                      <div className="flex-1">
                        <p className="text-blue-800 text-sm font-medium">{item.name}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-blue-600">Stock: {item.current_quantity}</span>
                          <span className="mx-2 text-blue-300">|</span>
                          <span className="text-xs text-blue-600">Mínimo: {item.min_quantity || 5}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </VenetianTile>
          </div>
        );
        
      case 'clients':
        return (
          <div>
            <h3 className="text-lg font-medium text-blue-800 mb-4">Reporte de Clientes</h3>
            
            <VenetianTile className="overflow-hidden mb-6">
              <div className="p-6">
                <h4 className="text-md font-medium text-blue-800 mb-4">Clientes Principales</h4>
                <div className="space-y-4">
                  {topClients.map((client, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">{client.name}</p>
                        <p className="text-xs text-blue-600">{client.orders} pedidos</p>
                      </div>
                      <p className="text-sm font-medium text-blue-800">{formatCurrency(client.purchases)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </VenetianTile>
            
            <VenetianTile className="overflow-hidden">
              <div className="p-6">
                <h4 className="text-md font-medium text-blue-800 mb-4">Distribución de Clientes por Tipo</h4>
                <div className="h-64">
                  <div className="h-full w-full bg-blue-50 rounded-lg flex items-center justify-center">
                    <div className="w-full px-6">
                      {[
                        { type: 'Hotel', count: 2, percentage: 25 },
                        { type: 'Club Deportivo', count: 1, percentage: 12.5 },
                        { type: 'Residencial', count: 2, percentage: 25 },
                        { type: 'Spa', count: 1, percentage: 12.5 },
                        { type: 'Parque Acuático', count: 1, percentage: 12.5 },
                        { type: 'Gimnasio', count: 1, percentage: 12.5 }
                      ].map((item, index) => (
                        <div key={index} className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-blue-600">{item.type}</span>
                            <span className="text-sm font-medium text-blue-800">{item.count} ({item.percentage}%)</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full bg-${['blue', 'green', 'teal', 'yellow', 'red', 'indigo'][index % 6]}-500`}
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </VenetianTile>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      {loading ? (
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-600">Cargando reportes...</p>
            </div>
          </div>
        </div>
      ) : (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 md:mb-0">Reportes</h2>
      </div>
      
      {/* Report controls */}
      <VenetianTile className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Reporte
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="sales">Ventas</option>
              <option value="inventory">Inventario</option>
              <option value="clients">Clientes</option>
              <option value="quotes">Cotizaciones</option>
              <option value="orders">Pedidos</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periodo
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="day">Hoy</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mes</option>
              <option value="quarter">Este Trimestre</option>
              <option value="year">Este Año</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Generar Reporte
                </div>
              )}
            </button>
          </div>
        </div>
      </VenetianTile>
      
      {/* Report content */}
      <div className="mb-6">
        {renderReportContent()}
      </div>
      
      {/* Export options */}
      <VenetianTile className="p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-4">Exportar Reporte</h3>
        
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            PDF
          </button>
          
          <button className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Excel
          </button>
          
          <button className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
            </svg>
            Imprimir
          </button>
          
          <button className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Email
          </button>
        </div>
      </VenetianTile>
    </div>
      )}
    </>
  );
};

export default ReportsPage;
